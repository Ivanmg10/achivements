import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'
import { isGameSource } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'
import { GROUP_ITEMS_MAX, readItemCounts, readItemFields } from '@/utils/groupValidation'

/**
 * Group items can be RA or Steam games; an item is (source, game_id), since RA
 * game ids and Steam appids overlap. A request without a source means RA, so
 * clients from before Steam existed keep working.
 */
function readSource(value: unknown): GameSource | null {
  if (value === undefined || value === null) return 'ra'
  return isGameSource(value) ? value : null
}

async function ownsGroup(userId: string, groupId: number) {
  if (!Number.isInteger(groupId)) return false
  const res = await pool.query('SELECT id FROM game_groups WHERE id = $1 AND user_id = $2', [groupId, userId])
  return res.rows.length > 0
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const groupId = parseInt(id)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    if (!(await ownsGroup(session.user.id, groupId))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const source = readSource(body?.source)
    if (!source) {
      return NextResponse.json({ message: 'source debe ser ra, steam o psn' }, { status: 400 })
    }
    const fields = readItemFields(body)
    if (!fields.ok) return NextResponse.json({ message: fields.message }, { status: 400 })
    const { game_id, title, image_icon, console_name, pct_won, num_awarded, max_possible, points_won, max_points } = fields.value

    const posRes = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next, COUNT(*)::int AS count FROM game_group_items WHERE group_id = $1',
      [groupId],
    )
    if (posRes.rows[0].count >= GROUP_ITEMS_MAX) {
      return NextResponse.json({ message: `Máximo ${GROUP_ITEMS_MAX} juegos por grupo` }, { status: 400 })
    }
    const position = posRes.rows[0].next

    const result = await pool.query(
      `INSERT INTO game_group_items (group_id, source, game_id, title, image_icon, console_name, pct_won, num_awarded, max_possible, points_won, max_points, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (group_id, source, game_id) DO NOTHING
       RETURNING id, source, game_id, title, image_icon, console_name, pct_won, num_awarded, max_possible, points_won, max_points, position, added_at`,
      [groupId, source, game_id, title, image_icon, console_name, pct_won,
       num_awarded, max_possible, points_won, max_points, position],
    )

    if (!result.rows.length) {
      return NextResponse.json({ message: 'El juego ya está en el grupo' }, { status: 409 })
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    console.error('[groups/[id]/games POST]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const groupId = parseInt(id)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    if (!(await ownsGroup(session.user.id, groupId))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 })
    }

    const gameId = req.nextUrl.searchParams.get('gameId')
    const source = readSource(req.nextUrl.searchParams.get('source'))
    if (!gameId) {
      return NextResponse.json({ message: 'Falta gameId' }, { status: 400 })
    }
    if (!source) {
      return NextResponse.json({ message: 'source debe ser ra, steam o psn' }, { status: 400 })
    }

    await pool.query(
      'DELETE FROM game_group_items WHERE group_id = $1 AND source = $2 AND game_id = $3',
      [groupId, source, gameId],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[groups/[id]/games DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const groupId = parseInt(id)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    if (!(await ownsGroup(session.user.id, groupId))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 })
    }

    const { order } = ((await req.json().catch(() => null)) ?? {}) as { order?: unknown }
    if (!Array.isArray(order) || order.length > GROUP_ITEMS_MAX || !order.every(Number.isInteger)) {
      return NextResponse.json({ message: 'order debe ser un array de IDs' }, { status: 400 })
    }

    // One statement: every id gets its index in the array, and only this group's items move.
    await pool.query(
      `UPDATE game_group_items AS i SET position = o.position - 1
         FROM unnest($1::int[]) WITH ORDINALITY AS o(id, position)
        WHERE i.id = o.id AND i.group_id = $2`,
      [order, groupId],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[groups/[id]/games PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const groupId = parseInt(id)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    if (!(await ownsGroup(session.user.id, groupId))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 })
    }

    const updates = (await req.json().catch(() => null)) as ({ source?: GameSource; game_id: number } & Record<string, unknown>)[] | null
    if (!Array.isArray(updates) || !updates.length) {
      return NextResponse.json({ ok: true })
    }
    if (updates.length > GROUP_ITEMS_MAX) {
      return NextResponse.json({ message: `Máximo ${GROUP_ITEMS_MAX} juegos por petición` }, { status: 400 })
    }
    const rows = []
    for (const u of updates) {
      const counts = u && Number.isInteger(u.game_id) ? readItemCounts(u) : null
      if (!counts?.ok) return NextResponse.json({ message: 'Contadores no válidos' }, { status: 400 })
      rows.push({ ...counts.value, game_id: u.game_id, source: readSource(u.source) ?? 'ra' })
    }

    await Promise.all(
      rows.map((u) =>
        pool.query(
          `UPDATE game_group_items
           SET num_awarded = $1, max_possible = $2, points_won = $3, max_points = $4
           WHERE group_id = $5 AND source = $6 AND game_id = $7`,
          [u.num_awarded, u.max_possible, u.points_won, u.max_points, groupId, u.source, u.game_id],
        ),
      ),
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[groups/[id]/games PATCH]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
