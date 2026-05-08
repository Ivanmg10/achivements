import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import pool from '@/lib/db'

async function ownsGroup(userId: string, groupId: number) {
  const res = await pool.query('SELECT id FROM game_groups WHERE id = $1 AND user_id = $2', [groupId, userId])
  return res.rows.length > 0
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const groupId = parseInt(id)

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  if (!(await ownsGroup(session.user.id, groupId))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 })
  }

  const { game_id, title, image_icon, console_name, pct_won } = await req.json()

  if (!game_id || !title) {
    return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 })
  }

  const posRes = await pool.query(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM game_group_items WHERE group_id = $1',
    [groupId],
  )
  const position = posRes.rows[0].next

  const result = await pool.query(
    `INSERT INTO game_group_items (group_id, game_id, title, image_icon, console_name, pct_won, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (group_id, game_id) DO NOTHING
     RETURNING id, game_id, title, image_icon, console_name, pct_won, position`,
    [groupId, game_id, title, image_icon ?? null, console_name ?? null, pct_won ?? 0, position],
  )

  if (!result.rows.length) {
    return NextResponse.json({ message: 'El juego ya está en el grupo' }, { status: 409 })
  }

  return NextResponse.json(result.rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  if (!gameId) {
    return NextResponse.json({ message: 'Falta gameId' }, { status: 400 })
  }

  await pool.query(
    'DELETE FROM game_group_items WHERE group_id = $1 AND game_id = $2',
    [groupId, gameId],
  )

  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const groupId = parseInt(id)

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  if (!(await ownsGroup(session.user.id, groupId))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 })
  }

  const { order } = await req.json() as { order: number[] }
  if (!Array.isArray(order)) {
    return NextResponse.json({ message: 'order debe ser un array de IDs' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (let i = 0; i < order.length; i++) {
      await client.query(
        'UPDATE game_group_items SET position = $1 WHERE id = $2 AND group_id = $3',
        [i, order[i], groupId],
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
}
