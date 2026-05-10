import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const gameId = req.nextUrl.searchParams.get('gameId')

  const query = gameId
    ? `SELECT achievement_id, game_id, game_title, snapshot, num_distinct_players, created_at
       FROM pinned_achievements
       WHERE user_id = $1 AND game_id = $2
       ORDER BY created_at DESC`
    : `SELECT achievement_id, game_id, game_title, snapshot, num_distinct_players, created_at
       FROM pinned_achievements
       WHERE user_id = $1
       ORDER BY created_at DESC`

  const params = gameId ? [session.user.id, gameId] : [session.user.id]
  const result = await pool.query(query, params)

  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { achievement, gameId, gameTitle, numDistinctPlayers } = await req.json()

  if (!achievement?.ID || !gameId) {
    return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 })
  }

  await pool.query(
    `INSERT INTO pinned_achievements
       (user_id, achievement_id, game_id, game_title, snapshot, num_distinct_players)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, achievement_id)
     DO UPDATE SET snapshot = $5, num_distinct_players = $6, game_title = $4`,
    [session.user.id, achievement.ID, gameId, gameTitle, JSON.stringify(achievement), numDistinctPlayers ?? 0],
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const achievementId = req.nextUrl.searchParams.get('achievementId')
  if (!achievementId) {
    return NextResponse.json({ message: 'Falta achievementId' }, { status: 400 })
  }

  await pool.query(
    'DELETE FROM pinned_achievements WHERE user_id = $1 AND achievement_id = $2',
    [session.user.id, achievementId],
  )

  return NextResponse.json({ ok: true })
}
