import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { steamApiKey } from '@/lib/fetchSteam'
import { withSteamCache } from '@/lib/steamCache'
import { getPlayerSummaries } from '@/lib/steamClient'
import type { PlayingNow } from '@/utils/friends'

/** Steam takes up to 100 accounts per summaries call. */
const PER_CALL = 100
/** "Playing now" is only worth a minute. */
const TTL_MS = 60 * 1000

type Summary = { steamid: string; gameid?: string; gameextrainfo?: string }

/**
 * What the people you follow are playing on Steam right now, by username, in
 * one Steam call per 100 of them. Kept apart from /api/follows/overview, which
 * reads only our database, so the cards never wait on Steam. Only for who
 * shares their presence here (`show_presence`) and has a public profile, and
 * only what Steam itself shows publicly (a private Steam profile shows no game).
 */
export async function GET() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response
  const key = steamApiKey()
  if (!key) return NextResponse.json({})

  try {
    const playing = await withSteamCache<PlayingNow>(
      `steamPlaying:${auth.id}`,
      TTL_MS,
      async () => {
        const { rows } = await pool.query(
          `SELECT u.username, u.steamid
             FROM follows f JOIN users u ON u.id = f.followed_id
            WHERE f.follower_id = $1 AND u.profile_public AND u.show_presence AND u.steamid IS NOT NULL`,
          [auth.id],
        )
        const byId = new Map<string, string[]>()
        for (const r of rows as { username: string; steamid: string }[]) {
          byId.set(r.steamid, [...(byId.get(r.steamid) ?? []), r.username])
        }
        const ids = [...byId.keys()]
        const out: PlayingNow = {}
        for (let i = 0; i < ids.length; i += PER_CALL) {
          const data = (await getPlayerSummaries(ids.slice(i, i + PER_CALL), key)) as { response?: { players?: Summary[] } }
          for (const p of data?.response?.players ?? []) {
            if (!p.gameid || !p.gameextrainfo) continue
            for (const username of byId.get(p.steamid) ?? []) out[username] = { appId: Number(p.gameid), name: p.gameextrainfo }
          }
        }
        return out
      },
      { userId: auth.id },
    )
    return NextResponse.json(playing)
  } catch (err) {
    console.error('[follows/playing GET]', err)
    return NextResponse.json({ error: 'steam-unavailable' }, { status: 503 })
  }
}
