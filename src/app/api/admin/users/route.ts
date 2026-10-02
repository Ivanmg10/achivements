import { NextResponse, after } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcrypt'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { sendEmailChangedNotice } from '@/lib/emailChangedNotice'
import { forgetUser } from '@/lib/userRecord'
import { sendVerificationEmail } from '@/lib/verificationEmail'
import { BCRYPT_COST, PASSWORD_MIN } from '@/utils/authValidation'
import { isTheme } from '@/types/types'

// Every handler here needs an admin who has unlocked the panel with their
// password (see adminAuth), and every change is written to the action log.

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUrl(url: string) {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

const isUsername = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 3 && v.length <= 20 && /^[a-zA-Z0-9_]+$/.test(v)

// GET — list all users
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const result = await pool.query(
      `SELECT id, username, email, theme, avatar, admin, rausername, steamid, steamusername, location,
              "raUser"->>'User' AS ra_display
       FROM users ORDER BY id ASC`
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('[admin/users GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST — create user (for the odd case the admin has to; sign-up is open to anyone)
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const { username, email, password, admin } = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }
    if (!isUsername(username)) {
      return NextResponse.json({ error: 'Username: 3–20 chars, letters/numbers/underscore' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
      return NextResponse.json({ error: `Password must be at least ${PASSWORD_MIN} characters` }, { status: 400 })
    }
    if (email && (typeof email !== 'string' || !isValidEmail(email))) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    const address = (email as string | undefined) || null

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
    if (address) {
      const taken = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [address])
      if (taken.rows.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }

    const hashed = await bcrypt.hash(password, BCRYPT_COST)
    const result = await pool.query(
      `INSERT INTO users (username, email, password, theme, admin)
       VALUES ($1, $2, $3, 'dark', $4)
       RETURNING id, username, email, theme, avatar, admin, rausername, steamid, steamusername, location`,
      [username, address, hashed, admin === true]
    )
    const created = result.rows[0]
    await logAdminAction(auth.admin, 'create-user', created, { email: address, admin: admin === true })
    // The owner confirms the address themselves, as on a normal sign-up.
    if (address) after(() => sendVerificationEmail(created.id, created.username, address))

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Username or email already in use' }, { status: 409 })
    }
    console.error('[admin/users POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH — edit user fields
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const { id, field, value } = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>

    if (!id || !field) {
      return NextResponse.json({ error: 'id and field required' }, { status: 400 })
    }
    if (!/^\d+$/.test(String(id))) {
      return NextResponse.json({ error: 'A numeric id is required' }, { status: 400 })
    }

    const ALLOWED = ['username', 'email', 'theme', 'admin', 'avatar', 'location'] as const
    type AllowedField = typeof ALLOWED[number]

    if (!ALLOWED.includes(field as AllowedField)) {
      return NextResponse.json({ error: 'Field not allowed' }, { status: 400 })
    }

    if (field === 'admin' && String(id) === auth.admin.id && value === false) {
      return NextResponse.json({ error: 'Cannot remove your own admin' }, { status: 400 })
    }

    if (field === 'admin') {
      if (typeof value !== 'boolean') {
        return NextResponse.json({ error: 'admin must be boolean' }, { status: 400 })
      }
    }

    if (field === 'username') {
      if (!isUsername(value)) {
        return NextResponse.json({ error: 'Username: 3–20 chars, letters/numbers/underscore' }, { status: 400 })
      }
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2', [value, id])
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
    }

    if (field === 'email') {
      if (value !== null && (typeof value !== 'string' || !isValidEmail(value))) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      if (value !== null) {
        const taken = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [value, id])
        if (taken.rows.length > 0) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
        }
      }
    }

    if (field === 'avatar') {
      if (value !== null && (typeof value !== 'string' || !isValidUrl(value))) {
        return NextResponse.json({ error: 'Avatar must be a valid https URL' }, { status: 400 })
      }
    }

    if (field === 'location') {
      if (value !== null && (typeof value !== 'string' || !/^[A-Z]{2}$/.test(value.toUpperCase()))) {
        return NextResponse.json({ error: 'Location must be a 2-letter country code' }, { status: 400 })
      }
    }

    if (field === 'theme') {
      if (!isTheme(value)) {
        return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
      }
    }

    // What it was, for the log and for telling the old address.
    const before = await pool.query(`SELECT id, username, email, "${field}" AS previous FROM users WHERE id = $1`, [id])
    const target = before.rows[0]
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // A new address has not been confirmed yet, whatever the old one was.
    const resetVerified = field === 'email' ? ', email_verified_at = NULL' : ''
    await pool.query(`UPDATE users SET "${field}" = $1${resetVerified} WHERE id = $2`, [value, id])
    forgetUser(id as string)
    await logAdminAction(auth.admin, 'update-user', target, { field, from: target.previous ?? null, to: value ?? null })

    if (field === 'email' && target.email && typeof value === 'string' && target.email.toLowerCase() !== value.toLowerCase()) {
      // An admin changing the recovery address is exactly what a takeover
      // looks like: the old address always hears about it.
      const notice = { to: target.email as string, username: target.username as string, newEmail: value, byAdmin: true }
      after(() => sendEmailChangedNotice(notice))
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Username or email already in use' }, { status: 409 })
    }
    console.error('[admin/users PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE — remove a user and everything they own (groups, pins, cache: all cascade)
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const id = new URL(req.url).searchParams.get('id')
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'A numeric id is required' }, { status: 400 })
    }
    if (id === auth.admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id])
    if (!result.rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    forgetUser(id)
    await logAdminAction(auth.admin, 'delete-user', result.rows[0])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
