import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import pool from '@/lib/db'
import { claimToken } from '@/lib/passwordReset'
import { forgetUser } from '@/lib/userRecord'
import { BCRYPT_COST, PASSWORD_MIN } from '@/utils/authValidation'

/**
 * Finishes a password reset: a live token plus a new password. The new hash
 * also ends every session the account had open (see authOptions' jwt callback).
 */
export async function POST(req: Request) {
  try {
    const { token, password } = (await req.json()) as { token?: unknown; password?: unknown }

    if (typeof token !== 'string' || typeof password !== 'string' || !token || !password) {
      return NextResponse.json({ error: 'token and password required' }, { status: 400 })
    }
    if (password.length < PASSWORD_MIN) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN} characters` },
        { status: 400 },
      )
    }

    const userId = await claimToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'invalid-token' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, BCRYPT_COST)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId])
    forgetUser(userId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/resetPassword]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
