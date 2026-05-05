import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcrypt'
import { authOptions } from '@/lib/authOptions'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  if (!session.user.admin) return null
  return session
}

// GET — list all users
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await pool.query(
    `SELECT id, username, email, theme, avatar, admin, rausername, steamusername, location,
            "raUser"->>'User' AS ra_display
     FROM users ORDER BY id ASC`
  )
  return NextResponse.json(result.rows)
}

// POST — create user
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { username, email, password, admin } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }
  if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: 'Username: 3–20 chars, letters/numbers/underscore' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const result = await pool.query(
    `INSERT INTO users (username, email, password, theme, admin)
     VALUES ($1, $2, $3, 'dark', $4)
     RETURNING id, username, email, theme, avatar, admin, rausername`,
    [username, email ?? null, hashed, admin ?? false]
  )
  return NextResponse.json(result.rows[0], { status: 201 })
}

// PATCH — edit user fields
export async function PATCH(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, field, value } = await req.json()

  if (!id || !field) {
    return NextResponse.json({ error: 'id and field required' }, { status: 400 })
  }

  const ALLOWED = ['username', 'email', 'theme', 'admin', 'avatar', 'location']
  if (!ALLOWED.includes(field)) {
    return NextResponse.json({ error: 'Field not allowed' }, { status: 400 })
  }

  // Prevent removing your own admin
  if (field === 'admin' && String(id) === String(session.user.id) && value === false) {
    return NextResponse.json({ error: 'Cannot remove your own admin' }, { status: 400 })
  }

  await pool.query(`UPDATE users SET "${field}" = $1 WHERE id = $2`, [value, id])
  return NextResponse.json({ ok: true })
}
