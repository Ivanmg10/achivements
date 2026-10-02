import { getServerSession } from 'next-auth'
import { NextResponse, after } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { checkCurrentPassword } from '@/lib/currentPassword'
import { forgetUser, loadUser } from '@/lib/userRecord'
import { sendVerificationEmail } from '@/lib/verificationEmail'
import { sendEmailChangedNotice } from '@/lib/emailChangedNotice'

const ALLOWED_FIELDS = ['username', 'email', 'avatar', 'location'] as const
type AllowedField = (typeof ALLOWED_FIELDS)[number]

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// https only: a plain-http image would be loaded by everyone who sees the
// avatar, over a connection anyone on their network can read or alter.
function isValidUrl(url: string) {
  try {
    return new URL(url).protocol === 'https:'
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
    const { field, value, currentPassword } = body as { field: AllowedField; value: string; currentPassword?: unknown }

    if (!ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    const trimmed = typeof value === 'string' ? value.trim() : ''
    let previousEmail: string | null = null
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
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2', [trimmed, session.user.id])
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
    }

    if (field === 'email') {
      if (!isValidEmail(trimmed)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [trimmed, session.user.id])
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      // The recovery address is the key to the account: with a stolen session
      // and no password check, changing it and asking for a reset would be a
      // takeover. So it takes the current password too.
      const check = await checkCurrentPassword(session.user.id, currentPassword)
      if (check === 'too-many') return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
      if (check === 'no-user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (check === 'wrong') return NextResponse.json({ error: 'wrong-password' }, { status: 403 })
      // Read just now by the password check, so this comes from the cache.
      previousEmail = (await loadUser(session.user.id))?.email ?? null
    }

    if (field === 'avatar') {
      if (!isValidUrl(trimmed)) {
        return NextResponse.json({ error: 'Avatar must be a valid https URL' }, { status: 400 })
      }
    }

    if (field === 'location' && !/^[A-Z]{2}$/.test(trimmed.toUpperCase())) {
      return NextResponse.json({ error: 'Location must be a valid 2-letter country code' }, { status: 400 })
    }

    const column = field === 'username' ? 'username' : field
    const valueToStore = field === 'location' ? trimmed.toUpperCase() : trimmed
    // A new address has not been confirmed yet, whatever the old one was.
    const resetVerified = field === 'email' ? ', email_verified_at = NULL' : ''
    await pool.query(`UPDATE users SET "${column}" = $1${resetVerified} WHERE id = $2`, [valueToStore, session.user.id])
    forgetUser(session.user.id)
    if (field === 'avatar') {
      // A link replaces any uploaded picture, which no longer has a reason to be kept.
      await pool.query('DELETE FROM user_avatars WHERE user_id = $1', [session.user.id])
    }
    if (field === 'email') {
      const username = session.user.name ?? ''
      after(() => sendVerificationEmail(session.user.id, username, trimmed))
      // The old address hears about it too: it is the one a takeover would silence.
      if (previousEmail && previousEmail.toLowerCase() !== trimmed.toLowerCase()) {
        const to = previousEmail
        after(() => sendEmailChangedNotice({ to, username, newEmail: trimmed, byAdmin: false }))
      }
    }

    return NextResponse.json({ ok: true, field, value: trimmed })
  } catch (err) {
    // Another account took the name or address between the check and the write.
    if ((err as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Already in use' }, { status: 409 })
    }
    console.error('[updateUserProfile POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
