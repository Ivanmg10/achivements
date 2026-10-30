import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { isGameSource } from '@/utils/gameRef'
import { dbId } from '@/utils/dbId'
import { sourceAllowed } from '@/utils/xboxAccess'
import type { GameSource } from '@/types/steam'

/**
 * Pinned games, RA or Steam. A pin is (source, game_id) — RA game ids and
 * Steam appids overlap. A request without a source means RA, so clients from
 * before Steam existed keep working.
 */

/** Enough for any home; a cap so one account cannot fill the table or hold a connection. */
const PINS_MAX = 1000

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
    if (typeof gameId !== 'number' || dbId(gameId) === null) {
      return NextResponse.json({ message: 'gameId debe ser un número' }, { status: 400 })
    }
    if (!source) {
      return NextResponse.json({ message: 'source debe ser ra, steam, psn o xbox' }, { status: 400 })
    }
    if (!sourceAllowed(source, session.user.admin)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { rows: held } = await pool.query('SELECT COUNT(*)::int AS n FROM pinned_games WHERE user_id = $1', [session.user.id])
    if (held[0]?.n >= PINS_MAX) return NextResponse.json({ error: 'too-many-pins' }, { status: 409 })

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
    if (dbId(gameId) === null) {
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
  if (!Array.isArray(value) || value.length > PINS_MAX) return null
  // Keyed, as a game named twice would stop the one statement that saves them.
  const order = new Map<string, OrderEntry>()
  for (const entry of value) {
    const source = typeof entry === 'number' ? 'ra' : readSource((entry as { source?: unknown })?.source)
    const gameId = dbId(typeof entry === 'number' ? entry : (entry as { gameId?: unknown })?.gameId)
    if (!source || gameId === null) return null
    order.set(`${source}:${gameId}`, { source, gameId })
  }
  return [...order.values()]
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
    if (order.some((entry) => !sourceAllowed(entry.source, session.user.admin))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // One statement: every game gets its index in the array, or none does.
    await pool.query(
      `INSERT INTO pinned_games (user_id, source, game_id, position)
       SELECT $1, o.source, o.game_id, o.position - 1
       FROM unnest($2::text[], $3::int[]) WITH ORDINALITY AS o(source, game_id, position)
       ON CONFLICT (user_id, source, game_id) DO UPDATE SET position = EXCLUDED.position`,
      [session.user.id, order.map((e) => e.source), order.map((e) => e.gameId)],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pinnedGames PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
