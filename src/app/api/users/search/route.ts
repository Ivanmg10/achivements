import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { allowAttempt } from '@/lib/attemptLimit'

const MIN_QUERY = 3
const LIMIT = 8

/** `_` is common in usernames and is a wildcard in LIKE, so it (and % and \) is escaped. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

/**
 * CheevoVault users whose name starts with `q`, an exact match first. Private
 * profiles are left out (but you still find yourself), and the number of
 * searches per account is limited so the list cannot be walked.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < MIN_QUERY) return NextResponse.json({ error: 'Query too short' }, { status: 400 })

  if (!(await allowAttempt('user-search', `user:${auth.id}`))) {
    return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
  }

  try {
    const { rows } = await pool.query(
      `SELECT username, avatar,
              rausername IS NOT NULL AS ra, steamid IS NOT NULL AS steam, psnaccountid IS NOT NULL AS psn
       FROM users
       WHERE username ILIKE $1 || '%' AND (profile_public OR id = $3::int)
       ORDER BY (LOWER(username) = LOWER($2)) DESC, username ASC
       LIMIT ${LIMIT}`,
      [escapeLike(q), q, auth.id],
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[users/search GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
