import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { readVerification } from '@/lib/emailVerification'
import { forgetUser } from '@/lib/userRecord'

/** Back to the account page with a flag the UI turns into a message. */
function back(origin: string, status: 'verified' | 'expired' | 'mismatch') {
  const url = new URL('/user', origin)
  url.searchParams.set('email', status)
  return NextResponse.redirect(url)
}

/**
 * Follows a verification link. Signed in or not — the link itself is the
 * proof, and someone reading their mail on a phone they never signed in on
 * should still be able to confirm the address.
 *
 * The address is matched as well as the id, so a link stops working once the
 * account's email changes: a stale link cannot mark a new, untested address
 * as verified.
 */
export async function GET(req: NextRequest) {
  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || req.nextUrl.origin

  const verification = readVerification(req.nextUrl.searchParams.get('token'))
  if (!verification) return back(origin, 'expired')

  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET email_verified_at = NOW()
        WHERE id = $1 AND LOWER(email) = LOWER($2) AND email_verified_at IS NULL`,
      [verification.userId, verification.email],
    )

    const { rows } = await pool.query(
      'SELECT email_verified_at FROM users WHERE id = $1 AND LOWER(email) = LOWER($2)',
      [verification.userId, verification.email],
    )
    // Already verified counts as verified: following the link twice is not an error.
    if (!rows[0]) return back(origin, 'mismatch')

    if (rowCount) forgetUser(verification.userId)
    return back(origin, 'verified')
  } catch (err) {
    console.error('[auth/verifyEmail]', err)
    return back(origin, 'expired')
  }
}
