import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { dataOwner } from '@/lib/apiAuth'
import pool from '@/lib/db'
import { gameKey, parseGameKey } from '@/utils/gameRef'
import { canUseXbox, sourceAllowed } from '@/utils/xboxAccess'

/** More than any library's perfect games; a cap so one request cannot hold a connection. */
const ORDER_MAX = 5000

export async function GET(req?: Request) {
  try {
    const owner = await dataOwner(req)
    if (!owner) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const result = await pool.query(
      'SELECT source, game_id, position FROM perfect_games_order WHERE user_id = $1 ORDER BY position ASC',
      [owner.id],
    )
    // Xbox is admin-only for now: to anyone else it is not there at all (see canUseXbox).
    const xbox = canUseXbox((await getServerSession(authOptions))?.user?.admin)
    return NextResponse.json(xbox ? result.rows : result.rows.filter((r: { source: string }) => r.source !== 'xbox'))
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

    const { order } = (await req.json().catch(() => ({}))) as { order?: unknown }
    // Keys name the platform ("ra:123", "steam:620"); a bare number is an RA id,
    // as the order was stored before Steam games joined the list.
    const refs = Array.isArray(order) && order.length <= ORDER_MAX
      ? order.map((entry) => (typeof entry === 'number' ? parseGameKey(gameKey('ra', entry)) : parseGameKey(String(entry))))
      : null
    if (!refs || refs.some((ref) => ref === null)) {
      return NextResponse.json({ message: 'order debe ser un array de claves de juego' }, { status: 400 })
    }

    if (refs.some((ref) => !sourceAllowed(ref!.source, session.user.admin))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // One statement: every game gets its index in the array, or none does. Keyed, as a game named twice would stop it.
    const games = [...new Map(refs.map((ref) => [gameKey(ref!.source, ref!.id), ref!])).values()]
    await pool.query(
      `INSERT INTO perfect_games_order (user_id, source, game_id, position)
       SELECT $1, o.source, o.game_id, o.position - 1
       FROM unnest($2::text[], $3::int[]) WITH ORDINALITY AS o(source, game_id, position)
       ON CONFLICT (user_id, source, game_id) DO UPDATE SET position = EXCLUDED.position, updated_at = NOW()`,
      [session.user.id, games.map((g) => g.source), games.map((g) => g.id)],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[perfectGamesOrder PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
