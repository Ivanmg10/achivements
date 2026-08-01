import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const result = await pool.query(
      'SELECT game_id, position FROM pinned_games WHERE user_id = $1 ORDER BY position ASC',
      [session.user.id],
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('[pinnedGames GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { gameId } = await req.json()
    if (typeof gameId !== 'number') {
      return NextResponse.json({ message: 'gameId debe ser un número' }, { status: 400 })
    }

    await pool.query(
      `INSERT INTO pinned_games (user_id, game_id, position)
       VALUES ($1, $2, COALESCE((SELECT MAX(position) + 1 FROM pinned_games WHERE user_id = $1), 0))
       ON CONFLICT (user_id, game_id) DO NOTHING`,
      [session.user.id, gameId],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pinnedGames POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const gameId = req.nextUrl.searchParams.get('gameId')
    if (!gameId) {
      return NextResponse.json({ message: 'Falta gameId' }, { status: 400 })
    }

    await pool.query('DELETE FROM pinned_games WHERE user_id = $1 AND game_id = $2', [
      session.user.id,
      gameId,
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pinnedGames DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { order } = (await req.json()) as { order: number[] }
    if (!Array.isArray(order) || order.some((id) => typeof id !== 'number')) {
      return NextResponse.json({ message: 'order debe ser un array de gameIds' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (let i = 0; i < order.length; i++) {
        await client.query(
          `INSERT INTO pinned_games (user_id, game_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, game_id) DO UPDATE SET position = EXCLUDED.position`,
          [session.user.id, order[i], i],
        )
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pinnedGames PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
