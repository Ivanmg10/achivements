import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcrypt'
import { authOptions } from '@/lib/authOptions'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
  }

  const result = await pool.query('SELECT password FROM users WHERE id = $1', [session.user.id])
  const user = result.rows[0]
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, session.user.id])

  return NextResponse.json({ ok: true })
}
