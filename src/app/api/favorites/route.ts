import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'

function parseSource(req: NextRequest): 'ra' | 'steam' {
  return req.nextUrl.searchParams.get('source') === 'steam' ? 'steam' : 'ra'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const gameId = req.nextUrl.searchParams.get('gameId')

    // Every pin across both platforms, newest first: the main page's pinned card.
    if (req.nextUrl.searchParams.get('source') === 'all') {
      const result = await pool.query(
        `SELECT achievement_id, steam_apiname, game_id, game_title, snapshot, num_distinct_players, source, created_at
         FROM pinned_achievements
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [session.user.id],
      )
      return NextResponse.json(result.rows)
    }

    const source = parseSource(req)
    const query = gameId
      ? `SELECT achievement_id, steam_apiname, game_id, game_title, snapshot, num_distinct_players, source, created_at
         FROM pinned_achievements
         WHERE user_id = $1 AND source = $2 AND game_id = $3
         ORDER BY created_at DESC`
      : `SELECT achievement_id, steam_apiname, game_id, game_title, snapshot, num_distinct_players, source, created_at
         FROM pinned_achievements
         WHERE user_id = $1 AND source = $2
         ORDER BY created_at DESC`

    const params = gameId ? [session.user.id, source, gameId] : [session.user.id, source]
    const result = await pool.query(query, params)

    return NextResponse.json(result.rows)
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

    const body = await req.json()
    const { gameId, gameTitle, numDistinctPlayers } = body

    if (body.source === 'steam') {
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
    const gameId = req.nextUrl.searchParams.get('gameId')

    if (achievementId) {
      await pool.query(
        `DELETE FROM pinned_achievements WHERE user_id = $1 AND achievement_id = $2 AND source = 'ra'`,
        [session.user.id, achievementId],
      )
    } else if (steamApiname && gameId) {
      await pool.query(
        `DELETE FROM pinned_achievements WHERE user_id = $1 AND game_id = $2 AND steam_apiname = $3 AND source = 'steam'`,
        [session.user.id, gameId, steamApiname],
      )
    } else {
      return NextResponse.json({ message: 'Falta achievementId o steamApiname/gameId' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[favorites DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
