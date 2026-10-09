import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { withCache } from '@/lib/raCache'
import { getGame } from '@/lib/raClient'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getAppDetails } from '@/lib/steamClient'
import { psnReleaseYear, psnTitles } from '@/lib/psnClient'
import { igdbArt } from '@/lib/igdbClient'
import type { PsnGameProgress } from '@/types/psn'
import { toSteamGameDetails } from '@/utils/steamMappers'
import { mapLimit, parseReleaseYear } from '@/utils/utils'
import type { GameSource, SteamAppDetailsResponse, SteamGameDetails } from '@/types/steam'

const RA_TTL = 4 * 60 * 60 * 1000
/** Lookups at a time: RA and the Steam store both turn away bursts. */
const CONCURRENCY = 4
/** A visit fills at most this many; the next visit carries on. */
const BATCH = 40

type Row = { id: number; source: GameSource; game_id: number }

/**
 * Fills in the release year of a group's games that have none yet, for the
 * decade filter: RA games from RA, Steam games from the store. Each is looked
 * up once and stored (0 when there is no year to find), so a group costs these
 * requests the first time only. Answers the years it filled.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const groupId = parseInt(id)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    if (!Number.isInteger(groupId)) return NextResponse.json({ message: 'Grupo no válido' }, { status: 400 })

    const owner = await pool.query('SELECT id FROM game_groups WHERE id = $1 AND user_id = $2', [groupId, session.user.id])
    if (!owner.rows.length) return NextResponse.json({ message: 'No autorizado' }, { status: 403 })

    const pending = await pool.query(
      `SELECT id, source, game_id FROM game_group_items
        WHERE group_id = $1 AND release_year IS NULL
        ORDER BY position LIMIT $2`,
      [groupId, BATCH],
    )
    const raKey = session.user.raid
    const rows = (pending.rows as Row[]).filter((r) => r.source !== 'ra' || raKey)
    if (!rows.length) return NextResponse.json({ years: [] })

    // The owner's PSN games, for their Store concepts or titles; read once, and only if a PSN row needs it.
    const accountId = session.user.psnaccountid
    let psnGames: Promise<Map<number, PsnGameProgress> | null> | null = null
    const ownPsnGames = () =>
      (psnGames ??= accountId
        ? psnTitles(accountId, session.user.id).then((games) => new Map(games.map((g) => [g.id, g])))
        : Promise.resolve(null))

    const results = await mapLimit(rows, CONCURRENCY, async (row) => {
      // Sony's trophy data has no release date: it comes from the game's
      // PlayStation Store page, or for PS3/Vita (no Store page) from IGDB.
      // Neither knows it: no year known (0).
      if (row.source === 'psn') {
        const game = (await ownPsnGames())?.get(row.game_id)
        if (!game) return { id: row.id, year: 0 }
        if (game.conceptId) return { id: row.id, year: (await psnReleaseYear(game.conceptId)) ?? 0 }
        return { id: row.id, year: (await igdbArt(game.title, game.consoleName))?.releaseYear ?? 0 }
      }
      if (row.source === 'steam') {
        const details = await withSteamCache<SteamGameDetails | null>(
          `steamStore:${row.game_id}:english`,
          TTL.schema,
          async () => toSteamGameDetails(row.game_id, (await getAppDetails(row.game_id, 'english')) as SteamAppDetailsResponse),
          { shouldCache: (d) => d !== null },
        )
        return { id: row.id, year: parseReleaseYear(details?.releaseDate) ?? 0 }
      }
      const game = await withCache<{ Released?: string | null }>(
        `gameData_v2:${row.game_id}`,
        RA_TTL,
        () => getGame(row.game_id, raKey!) as Promise<{ Released?: string | null }>,
        (d) => d !== null && typeof d === 'object' && 'Title' in d,
      )
      return { id: row.id, year: parseReleaseYear(game?.Released) ?? 0 }
    })

    // A failed lookup stays NULL and is tried again on a later visit.
    const found = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
    if (found.length) {
      await pool.query(
        `UPDATE game_group_items AS i SET release_year = f.year
           FROM unnest($1::int[], $2::smallint[]) AS f(id, year)
          WHERE i.id = f.id AND i.group_id = $3`,
        [found.map((f) => f.id), found.map((f) => f.year), groupId],
      )
    }
    return NextResponse.json({ years: found.map((f) => ({ id: f.id, release_year: f.year })) })
  } catch (err) {
    console.error('[groups/[id]/years POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
