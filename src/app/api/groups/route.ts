import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const result = await pool.query(
    `SELECT g.id, g.title, g.description, g.icon, g.is_public, g.position, g.created_at, g.updated_at,
            COUNT(i.id)::int AS game_count
     FROM game_groups g
     LEFT JOIN game_group_items i ON i.group_id = g.id
     WHERE g.user_id = $1
     GROUP BY g.id
     ORDER BY g.position ASC, g.created_at ASC`,
    [session.user.id],
  )

  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { title, description, icon, is_public } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ message: 'El título es obligatorio' }, { status: 400 })
  }

  const countRes = await pool.query(
    'SELECT COUNT(*) FROM game_groups WHERE user_id = $1',
    [session.user.id],
  )
  if (parseInt(countRes.rows[0].count) >= 4) {
    return NextResponse.json({ message: 'Máximo 4 grupos permitidos' }, { status: 400 })
  }

  const posRes = await pool.query(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM game_groups WHERE user_id = $1',
    [session.user.id],
  )
  const position = posRes.rows[0].next

  const result = await pool.query(
    `INSERT INTO game_groups (user_id, title, description, icon, is_public, position)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, description, icon, is_public, position, created_at, updated_at`,
    [session.user.id, title.trim(), description ?? null, icon ?? null, is_public ?? false, position],
  )

  return NextResponse.json({ ...result.rows[0], game_count: 0 }, { status: 201 })
}
