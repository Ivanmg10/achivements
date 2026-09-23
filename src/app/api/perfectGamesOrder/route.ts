import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { gameKey, parseGameKey } from '@/utils/gameRef'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const result = await pool.query(
      'SELECT source, game_id, position FROM perfect_games_order WHERE user_id = $1 ORDER BY position ASC',
      [session.user.id],
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('[perfectGamesOrder GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { order } = await req.json() as { order: unknown }
    // Keys name the platform ("ra:123", "steam:620"); a bare number is an RA id,
    // as the order was stored before Steam games joined the list.
    const refs = Array.isArray(order)
      ? order.map((entry) => (typeof entry === 'number' ? parseGameKey(gameKey('ra', entry)) : parseGameKey(String(entry))))
      : null
    if (!refs || refs.some((ref) => ref === null)) {
      return NextResponse.json({ message: 'order debe ser un array de claves de juego' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (let i = 0; i < refs.length; i++) {
        const { source, id } = refs[i]!
        await client.query(
          `INSERT INTO perfect_games_order (user_id, source, game_id, position)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, source, game_id) DO UPDATE SET position = EXCLUDED.position, updated_at = NOW()`,
          [session.user.id, source, id, i],
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
    console.error('[perfectGamesOrder PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
