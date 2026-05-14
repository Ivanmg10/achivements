import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'

async function ownsGroup(userId: string, groupId: number) {
  const res = await pool.query('SELECT id FROM game_groups WHERE id = $1 AND user_id = $2', [groupId, userId])
  return res.rows.length > 0
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const groupId = parseInt(id)

    const session = await getServerSession(authOptions)

    const groupRes = await pool.query(
      `SELECT g.id, g.title, g.description, g.icon, g.is_public, g.position, g.user_id, g.created_at, g.updated_at
       FROM game_groups g WHERE g.id = $1`,
      [groupId],
    )
    if (!groupRes.rows.length) {
      return NextResponse.json({ message: 'No encontrado' }, { status: 404 })
    }

    const group = groupRes.rows[0]
    if (!group.is_public && String(session?.user?.id) !== String(group.user_id)) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const itemsRes = await pool.query(
      `SELECT id, game_id, title, image_icon, console_name, pct_won, num_awarded, max_possible, points_won, max_points, position, added_at
       FROM game_group_items
       WHERE group_id = $1
       ORDER BY position ASC`,
      [groupId],
    )

    return NextResponse.json({ ...group, items: itemsRes.rows })
  } catch (err) {
    console.error('[groups/[id] GET]', err)
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

    const { title, description, icon, is_public } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ message: 'El título es obligatorio' }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE game_groups
       SET title = $1, description = $2, icon = $3, is_public = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, description, icon, is_public, position, created_at, updated_at`,
      [title.trim(), description ?? null, icon ?? null, is_public ?? false, groupId],
    )

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('[groups/[id] PUT]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    await pool.query('DELETE FROM game_groups WHERE id = $1', [groupId])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[groups/[id] DELETE]', err)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
