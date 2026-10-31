import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { dataOwner } from '@/lib/apiAuth'
import { dbId } from '@/utils/dbId'
import { canUseXbox, sourceAllowed } from '@/utils/xboxAccess'

/** Enough for any list of goals; a cap so one account cannot fill the table. */
const PINS_MAX = 1000
const TEXT_MAX = 300
const SNAPSHOT_MAX = 8 * 1024

function parseSource(req: NextRequest): 'ra' | 'steam' | 'psn' | 'xbox' {
  const source = req.nextUrl.searchParams.get('source')
  return source === 'steam' || source === 'psn' || source === 'xbox' ? source : 'ra'
}

/**
 * The user's own pins: their goals, "achievements to get". Only theirs: a
 * `?user=` is ignored, since others see the showcase (/api/showcase), not this.
 */
export async function GET(req: NextRequest) {
  try {
    const owner = await dataOwner()
    if (!owner) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const gameId = req.nextUrl.searchParams.get('gameId')
    if (gameId && dbId(gameId) === null) return NextResponse.json({ message: 'gameId no válido' }, { status: 400 })
    // Xbox is admin-only for now: to anyone else it is not there at all (see canUseXbox).
    const xboxVisible = canUseXbox((await getServerSession(authOptions))?.user?.admin)
    const visible = <T extends { source: string }>(rows: T[]) => (xboxVisible ? rows : rows.filter((r) => r.source !== 'xbox'))

    // Every pin across every platform, in the user's order (migrations/037): the
    // ones never placed first, newest first, then the placed ones.
    if (req.nextUrl.searchParams.get('source') === 'all') {
      const result = await pool.query(
        `SELECT id, achievement_id, steam_apiname, psn_trophy_id, xbox_achievement_id, game_id, game_title, snapshot, num_distinct_players, source, created_at
         FROM pinned_achievements
         WHERE user_id = $1
         ORDER BY position ASC NULLS FIRST, created_at DESC`,
        [owner.id],
      )
      return NextResponse.json(visible(result.rows))
    }

    const source = parseSource(req)
    const query = gameId
      ? `SELECT achievement_id, steam_apiname, psn_trophy_id, xbox_achievement_id, game_id, game_title, snapshot, num_distinct_players, source, created_at
         FROM pinned_achievements
         WHERE user_id = $1 AND source = $2 AND game_id = $3
         ORDER BY created_at DESC`
      : `SELECT achievement_id, steam_apiname, psn_trophy_id, xbox_achievement_id, game_id, game_title, snapshot, num_distinct_players, source, created_at
         FROM pinned_achievements
         WHERE user_id = $1 AND source = $2
         ORDER BY created_at DESC`

    const params = gameId ? [owner.id, source, gameId] : [owner.id, source]
    const result = await pool.query(query, params)

    return NextResponse.json(visible(result.rows))
  } catch (err) {
    console.error('[favorites GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 })
    const { gameId, gameTitle, numDistinctPlayers } = body
    if (!sourceAllowed(body.source, session.user.admin)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const tooLong = (v: unknown) => v != null && (typeof v !== 'string' || v.length > TEXT_MAX)
    if (tooLong(gameTitle) || tooLong(body.steamApiname) || tooLong(body.xboxAchievementId) || JSON.stringify(body.achievement ?? {}).length > SNAPSHOT_MAX) {
      return NextResponse.json({ message: 'Datos no válidos' }, { status: 400 })
    }
    const { rows: held } = await pool.query('SELECT COUNT(*)::int AS n FROM pinned_achievements WHERE user_id = $1', [session.user.id])
    if (held[0]?.n >= PINS_MAX) return NextResponse.json({ error: 'too-many-pins' }, { status: 409 })

    if (body.source === 'xbox') {
      const { xboxAchievementId, achievement } = body
      if (typeof xboxAchievementId !== 'string' || !xboxAchievementId || !Number.isInteger(gameId)) {
        return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 })
      }
      await pool.query(
        `INSERT INTO pinned_achievements
           (user_id, source, xbox_achievement_id, game_id, game_title, snapshot, num_distinct_players)
         VALUES ($1, 'xbox', $2, $3, $4, $5, 0)
         ON CONFLICT (user_id, game_id, xbox_achievement_id) WHERE source = 'xbox'
         DO UPDATE SET snapshot = $5, game_title = $4`,
        [session.user.id, xboxAchievementId, gameId, gameTitle, JSON.stringify(achievement ?? {})],
      )
    } else if (body.source === 'psn') {
      const { psnTrophyId, achievement } = body
      if (!Number.isInteger(psnTrophyId) || !Number.isInteger(gameId)) {
        return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 })
      }
      await pool.query(
        `INSERT INTO pinned_achievements
           (user_id, source, psn_trophy_id, game_id, game_title, snapshot, num_distinct_players)
         VALUES ($1, 'psn', $2, $3, $4, $5, 0)
         ON CONFLICT (user_id, game_id, psn_trophy_id) WHERE source = 'psn'
         DO UPDATE SET snapshot = $5, game_title = $4`,
        [session.user.id, psnTrophyId, gameId, gameTitle, JSON.stringify(achievement ?? {})],
      )
    } else if (body.source === 'steam') {
      const { steamApiname, achievement } = body
      if (!steamApiname || !gameId) {
        return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 })
      }
      await pool.query(
        `INSERT INTO pinned_achievements
           (user_id, source, steam_apiname, game_id, game_title, snapshot, num_distinct_players)
         VALUES ($1, 'steam', $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, game_id, steam_apiname) WHERE source = 'steam'
         DO UPDATE SET snapshot = $5, game_title = $4, num_distinct_players = $6`,
        [session.user.id, steamApiname, gameId, gameTitle, JSON.stringify(achievement ?? {}), numDistinctPlayers ?? 0],
      )
    } else {
      const { achievement } = body
      if (!achievement?.ID || !gameId) {
        return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 })
      }
      await pool.query(
        `INSERT INTO pinned_achievements
           (user_id, source, achievement_id, game_id, game_title, snapshot, num_distinct_players)
         VALUES ($1, 'ra', $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, achievement_id)
         DO UPDATE SET snapshot = $5, num_distinct_players = $6, game_title = $4`,
        [session.user.id, achievement.ID, gameId, gameTitle, JSON.stringify(achievement), numDistinctPlayers ?? 0],
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[favorites POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const achievementId = req.nextUrl.searchParams.get('achievementId')
    const steamApiname = req.nextUrl.searchParams.get('steamApiname')
    const psnTrophyId = req.nextUrl.searchParams.get('psnTrophyId')
    const xboxAchievementId = req.nextUrl.searchParams.get('xboxAchievementId')
    const gameId = req.nextUrl.searchParams.get('gameId')
    if ((gameId && dbId(gameId) === null) || (achievementId && dbId(achievementId) === null) || (psnTrophyId && dbId(psnTrophyId) === null)) {
      return NextResponse.json({ message: 'Id no válido' }, { status: 400 })
    }

    if (achievementId) {
      await pool.query(
        `DELETE FROM pinned_achievements WHERE user_id = $1 AND achievement_id = $2 AND source = 'ra'`,
        [session.user.id, achievementId],
      )
    } else if (xboxAchievementId && gameId) {
      await pool.query(
        `DELETE FROM pinned_achievements WHERE user_id = $1 AND game_id = $2 AND xbox_achievement_id = $3 AND source = 'xbox'`,
        [session.user.id, gameId, xboxAchievementId],
      )
    } else if (psnTrophyId && gameId) {
      await pool.query(
        `DELETE FROM pinned_achievements WHERE user_id = $1 AND game_id = $2 AND psn_trophy_id = $3 AND source = 'psn'`,
        [session.user.id, gameId, psnTrophyId],
      )
    } else if (steamApiname && gameId) {
      await pool.query(
        `DELETE FROM pinned_achievements WHERE user_id = $1 AND game_id = $2 AND steam_apiname = $3 AND source = 'steam'`,
        [session.user.id, gameId, steamApiname],
      )
    } else {
      return NextResponse.json({ message: 'Falta achievementId, steamApiname/gameId, psnTrophyId/gameId o xboxAchievementId/gameId' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[favorites DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

const MAX_ORDER = 1000

/**
 * Puts the user's pinned achievements in the order given, as their row ids
 * (from GET ?source=all). Ids that are not the user's are ignored by the WHERE,
 * so nobody can move someone else's pins.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const order = body?.order
    if (
      !Array.isArray(order) ||
      order.length === 0 ||
      order.length > MAX_ORDER ||
      !order.every((id) => Number.isInteger(id) && id > 0) ||
      new Set(order).size !== order.length
    ) {
      return NextResponse.json({ message: 'order debe ser un array de ids distintos' }, { status: 400 })
    }

    await pool.query(
      `UPDATE pinned_achievements p SET position = v.pos - 1
       FROM unnest($2::int[]) WITH ORDINALITY AS v(id, pos)
       WHERE p.id = v.id AND p.user_id = $1`,
      [session.user.id, order],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[favorites PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
