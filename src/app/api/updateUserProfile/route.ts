import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'

const ALLOWED_FIELDS = ['username', 'email', 'avatar', 'location'] as const
type AllowedField = (typeof ALLOWED_FIELDS)[number]

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { field, value } = body as { field: AllowedField; value: string }

    if (!ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    const trimmed = value?.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 })
    }

    if (field === 'username') {
      if (trimmed.length < 3 || trimmed.length > 20) {
        return NextResponse.json({ error: 'Username must be 3–20 characters' }, { status: 400 })
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return NextResponse.json({ error: 'Username: only letters, numbers and underscores' }, { status: 400 })
      }
      const existing = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [trimmed, session.user.id])
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
    }

    if (field === 'email') {
      if (!isValidEmail(trimmed)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [trimmed, session.user.id])
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }

    if (field === 'avatar') {
      if (!isValidUrl(trimmed)) {
        return NextResponse.json({ error: 'Avatar must be a valid http(s) URL' }, { status: 400 })
      }
    }

    if (field === 'location' && !/^[A-Z]{2}$/.test(trimmed.toUpperCase())) {
      return NextResponse.json({ error: 'Location must be a valid 2-letter country code' }, { status: 400 })
    }

    const column = field === 'username' ? 'username' : field
    const valueToStore = field === 'location' ? trimmed.toUpperCase() : trimmed
    await pool.query(`UPDATE users SET "${column}" = $1 WHERE id = $2`, [valueToStore, session.user.id])

    return NextResponse.json({ ok: true, field, value: trimmed })
  } catch (err) {
    console.error('[updateUserProfile POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
