import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { isGameSource } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

/**
 * Pinned games, RA or Steam. A pin is (source, game_id) — RA game ids and
 * Steam appids overlap. A request without a source means RA, so clients from
 * before Steam existed keep working.
 */

function readSource(value: unknown): GameSource | null {
  if (value === undefined || value === null) return 'ra'
  return isGameSource(value) ? value : null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const result = await pool.query(
      'SELECT source, game_id, position FROM pinned_games WHERE user_id = $1 ORDER BY position ASC',
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

    const body = await req.json().catch(() => null)
    const gameId = body?.gameId
    const source = readSource(body?.source)
    if (typeof gameId !== 'number') {
      return NextResponse.json({ message: 'gameId debe ser un número' }, { status: 400 })
    }
    if (!source) {
      return NextResponse.json({ message: 'source debe ser ra o steam' }, { status: 400 })
    }

    await pool.query(
      `INSERT INTO pinned_games (user_id, source, game_id, position)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(position) + 1 FROM pinned_games WHERE user_id = $1), 0))
       ON CONFLICT (user_id, source, game_id) DO NOTHING`,
      [session.user.id, source, gameId],
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
    const source = readSource(req.nextUrl.searchParams.get('source'))
    if (!gameId) {
      return NextResponse.json({ message: 'Falta gameId' }, { status: 400 })
    }
    if (!source) {
      return NextResponse.json({ message: 'source debe ser ra o steam' }, { status: 400 })
    }

    await pool.query('DELETE FROM pinned_games WHERE user_id = $1 AND source = $2 AND game_id = $3', [
      session.user.id,
      source,
      gameId,
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pinnedGames DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

type OrderEntry = { source: GameSource; gameId: number }

/** Accepts [{ source, gameId }] — or plain RA ids, as older clients sent. */
function readOrder(value: unknown): OrderEntry[] | null {
  if (!Array.isArray(value)) return null
  const order: OrderEntry[] = []
  for (const entry of value) {
    if (typeof entry === 'number') {
      order.push({ source: 'ra', gameId: entry })
      continue
    }
    const source = readSource((entry as { source?: unknown })?.source)
    const gameId = (entry as { gameId?: unknown })?.gameId
    if (!source || typeof gameId !== 'number') return null
    order.push({ source, gameId })
  }
  return order
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const order = readOrder(body?.order)
    if (!order) {
      return NextResponse.json({ message: 'order debe ser un array de { source, gameId }' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (let i = 0; i < order.length; i++) {
        await client.query(
          `INSERT INTO pinned_games (user_id, source, game_id, position)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, source, game_id) DO UPDATE SET position = EXCLUDED.position`,
          [session.user.id, order[i].source, order[i].gameId, i],
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
