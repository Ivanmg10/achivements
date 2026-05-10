import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, title, imageIcon } = body as { id?: number; title?: string; imageIcon?: string }

  if (!id || !title) return NextResponse.json({ error: 'id and title required' }, { status: 400 })

  const value = JSON.stringify({ id, title, imageIcon: imageIcon ?? '' })
  await pool.query('UPDATE users SET favorite_game = $1 WHERE id = $2', [value, session.user.id])

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await pool.query('UPDATE users SET favorite_game = NULL WHERE id = $1', [session.user.id])

  return NextResponse.json({ ok: true })
}
