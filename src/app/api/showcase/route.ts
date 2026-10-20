import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { dataOwner } from '@/lib/apiAuth'
import { canUseXbox, sourceAllowed } from '@/utils/xboxAccess'
import { parseShowcaseEntry, SHOWCASE_MAX } from '@/utils/showcase'

const COLUMNS = `id, source, game_id AS "gameId", achievement_key AS "achievementKey", game_title AS "gameTitle",
  title, description, badge, earned_at AS "earnedAt"`

/** The achievement showcase, in its order: the user's own, or, with `?user=`, that public profile's (see dataOwner). */
export async function GET(req: NextRequest) {
  try {
    const owner = await dataOwner(req)
    if (!owner) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM showcase_achievements WHERE user_id = $1 ORDER BY position ASC, created_at ASC`,
      [owner.id],
    )
    // Xbox is admin-only for now: to anyone else it is not there at all (see canUseXbox).
    const xbox = canUseXbox((await getServerSession(authOptions))?.user?.admin)
    return NextResponse.json(xbox ? rows : rows.filter((r: { source: string }) => r.source !== 'xbox'))
  } catch (err) {
    console.error('[showcase GET]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

/**
 * Adds an earned achievement at the end, while there are fewer than five.
 * Adding one already there is fine; a full showcase answers 409 `showcase-full`.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const entry = parseShowcaseEntry(await req.json().catch(() => null))
    if (!entry) return NextResponse.json({ error: 'invalid' }, { status: 400 })
    if (!sourceAllowed(entry.source, session.user.admin)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    // ponytail: two adds racing past the count can make six; harmless, and the next add says full.
    const inserted = await pool.query(
      `INSERT INTO showcase_achievements
         (user_id, source, game_id, achievement_key, game_title, title, description, badge, earned_at, position)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE(MAX(position) + 1, 0)
       FROM showcase_achievements WHERE user_id = $1
       HAVING COUNT(*) < ${SHOWCASE_MAX}
       ON CONFLICT (user_id, source, game_id, achievement_key) DO NOTHING
       RETURNING ${COLUMNS}`,
      [session.user.id, entry.source, entry.gameId, entry.achievementKey, entry.gameTitle, entry.title, entry.description, entry.badge, entry.earnedAt],
    )
    if (inserted.rows[0]) return NextResponse.json(inserted.rows[0])

    const existing = await pool.query(
      `SELECT ${COLUMNS} FROM showcase_achievements WHERE user_id = $1 AND source = $2 AND game_id = $3 AND achievement_key = $4`,
      [session.user.id, entry.source, entry.gameId, entry.achievementKey],
    )
    if (existing.rows[0]) return NextResponse.json(existing.rows[0])
    return NextResponse.json({ error: 'showcase-full' }, { status: 409 })
  } catch (err) {
    console.error('[showcase POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

/** Takes one out of the showcase, by its id (`?id=`). Someone else's id deletes nothing. */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const id = Number(req.nextUrl.searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'invalid' }, { status: 400 })

    await pool.query('DELETE FROM showcase_achievements WHERE id = $1 AND user_id = $2', [id, session.user.id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[showcase DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

/** Puts the showcase in the order given, as row ids. Ids that are not the user's are ignored. */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const order = (await req.json().catch(() => null))?.order
    if (
      !Array.isArray(order) ||
      order.length === 0 ||
      order.length > SHOWCASE_MAX * 2 ||
      !order.every((id) => Number.isInteger(id) && id > 0) ||
      new Set(order).size !== order.length
    ) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 })
    }

    await pool.query(
      `UPDATE showcase_achievements s SET position = o.pos
       FROM unnest($2::int[]) WITH ORDINALITY AS o(id, pos)
       WHERE s.id = o.id AND s.user_id = $1`,
      [session.user.id, order],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[showcase PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
