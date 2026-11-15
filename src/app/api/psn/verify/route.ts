import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requirePsnSession } from '@/lib/apiAuth'
import { reserveAttempt } from '@/lib/attemptLimit'
import { psnAboutMe, psnFailure } from '@/lib/psnClient'
import { aboutMeHasCode, makePsnVerificationCode, psnVerificationExpiry } from '@/lib/psnVerification'
import { markRankingVisibilityChanged } from '@/lib/rankings'
import { forgetUser } from '@/lib/userRecord'

/**
 * Proving a PSN account is the user's (#176): a code in its About Me. GET gives the code (or says the account is
 * verified), POST checks it, DELETE removes the verification. Only the signed-in user's own account, always:
 * the row is read here, not taken from the session, and the code goes nowhere but this answer.
 */

const NO_STORE = { 'Cache-Control': 'no-store' }

type Row = { psnaccountid: string | null; verified: boolean; code: string | null; expiresAt: string | null }

async function readRow(id: string): Promise<Row | null> {
  const { rows } = await pool.query(
    `SELECT psnaccountid, (psn_verified_at IS NOT NULL) AS verified, psn_verification_code AS code,
            psn_verification_expires_at AS "expiresAt"
     FROM users WHERE id = $1`,
    [id],
  )
  return rows[0] ?? null
}

const alive = (row: Row) => Boolean(row.code && row.expiresAt && new Date(row.expiresAt).getTime() > Date.now())

const fail = (error: string, status: number, headers?: Record<string, string>) => NextResponse.json({ error }, { status, headers })

/** The ranking lists keep a few minutes of what they read; a verification changes who counts. Best effort. */
async function pointsChanged(id: string) {
  forgetUser(id)
  await markRankingVisibilityChanged().catch((err) => console.error('[psn/verify] rankings', err))
}

export async function GET() {
  const auth = await requirePsnSession()
  if (!auth.ok) return auth.response

  try {
    let row = await readRow(auth.session.id)
    if (!row?.psnaccountid) return fail('not-linked', 400)
    if (row.verified) return NextResponse.json({ verified: true, code: null, expiresAt: null }, { headers: NO_STORE })

    if (!alive(row)) {
      // Only an expired or missing code is replaced, so two reads at once end up with one code.
      await pool.query(
        `UPDATE users SET psn_verification_code = $2, psn_verification_expires_at = $3
         WHERE id = $1 AND psn_verified_at IS NULL AND (psn_verification_code IS NULL OR psn_verification_expires_at <= NOW())`,
        [auth.session.id, makePsnVerificationCode(), psnVerificationExpiry()],
      )
      row = await readRow(auth.session.id)
    }
    if (!row || !alive(row)) return fail('failed', 500)
    return NextResponse.json({ verified: false, code: row.code, expiresAt: new Date(row.expiresAt as string).toISOString() }, { headers: NO_STORE })
  } catch (err) {
    console.error('[psn/verify GET]', err)
    return fail('failed', 500)
  }
}

/** Marks the account verified, only if the code is still the one that was checked. */
async function markVerified(id: string, row: Row): Promise<'verified' | 'taken' | 'changed'> {
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET psn_verified_at = NOW(), psn_verification_code = NULL, psn_verification_expires_at = NULL
       WHERE id = $1 AND psnaccountid = $2 AND psn_verification_code = $3 AND psn_verified_at IS NULL`,
      [id, row.psnaccountid, row.code],
    )
    return rowCount ? 'verified' : 'changed'
  } catch (err) {
    // The partial unique index is the last word: two users verifying one account at once, one of them wins.
    if ((err as { code?: string }).code === '23505') return 'taken'
    throw err
  }
}

async function accountIsTaken(id: string, psnaccountid: string): Promise<boolean> {
  const { rowCount } = await pool.query('SELECT 1 FROM users WHERE psnaccountid = $1 AND psn_verified_at IS NOT NULL AND id <> $2 LIMIT 1', [psnaccountid, id])
  return Boolean(rowCount)
}

export async function POST() {
  const auth = await requirePsnSession()
  if (!auth.ok) return auth.response
  const id = auth.session.id

  try {
    const row = await readRow(id)
    if (!row?.psnaccountid) return fail('not-linked', 400)
    if (row.verified) return NextResponse.json({ verified: true }, { headers: NO_STORE })
    if (!alive(row)) return fail('no-code', 409)
    if (await accountIsTaken(id, row.psnaccountid)) return fail('taken', 409)

    const attempt = await reserveAttempt('psn-verify', `user:${id}`)
    if (!attempt.allowed) {
      await attempt.release()
      return fail('rate-limited', 429, { 'Retry-After': '900' })
    }

    let aboutMe: string
    try {
      aboutMe = await psnAboutMe(row.psnaccountid)
    } catch (err) {
      await attempt.release()
      return psnFailure(err, 'psn/verify')
    }
    if (!aboutMeHasCode(aboutMe, row.code)) return fail('not-found', 422)

    await attempt.release()
    const outcome = await markVerified(id, row)
    if (outcome === 'taken') return fail('taken', 409)
    if (outcome === 'changed') return fail('no-code', 409)
    await pointsChanged(id)
    return NextResponse.json({ verified: true }, { headers: NO_STORE })
  } catch (err) {
    console.error('[psn/verify POST]', err)
    return fail('failed', 500)
  }
}

export async function DELETE() {
  const auth = await requirePsnSession()
  if (!auth.ok) return auth.response

  try {
    await pool.query(
      `UPDATE users SET psn_verified_at = NULL, psn_verification_code = NULL, psn_verification_expires_at = NULL WHERE id = $1`,
      [auth.session.id],
    )
    await pointsChanged(auth.session.id)
    return NextResponse.json({ verified: false }, { headers: NO_STORE })
  } catch (err) {
    console.error('[psn/verify DELETE]', err)
    return fail('failed', 500)
  }
}
