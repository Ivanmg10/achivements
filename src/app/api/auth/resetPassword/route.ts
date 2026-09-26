import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import pool from '@/lib/db'
import { consumeToken, userForToken } from '@/lib/passwordReset'
import { PASSWORD_MIN } from '@/utils/authValidation'

/** Finishes a password reset: a live token plus a new password. */
export async function POST(req: Request) {
  try {
    const { token, password } = (await req.json()) as { token?: string; password?: string }

    if (!token || !password) {
      return NextResponse.json({ error: 'token and password required' }, { status: 400 })
    }
    if (password.length < PASSWORD_MIN) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN} characters` },
        { status: 400 },
      )
    }

    const userId = await userForToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'invalid-token' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId])
    await consumeToken(token)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/resetPassword]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
