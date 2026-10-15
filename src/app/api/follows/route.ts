import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { requireSession } from '@/lib/apiAuth'
import { allowAttempt } from '@/lib/attemptLimit'
import { findPublicUser } from '@/lib/publicUser'
import { canUseXbox } from '@/utils/xboxAccess'

/** Enough for anyone; a cap so one account cannot fill the table. */
const FOLLOWS_MAX = 500

/**
 * The users you follow, newest first, with what CheevoVault knows of them
 * (no platform calls). Someone who made their profile private drops out of
 * the list until they make it public again.
 */
export async function GET() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    const { rows } = await pool.query(
      `SELECT u.username, u.avatar, u.location, LEFT(u.description, 120) AS description,
              u.rausername IS NOT NULL AS ra, u.steamid IS NOT NULL AS steam, u.psnaccountid IS NOT NULL AS psn,
              (u.xboxxuid IS NOT NULL AND $2::boolean) AS xbox
       FROM follows f JOIN users u ON u.id = f.followed_id
       WHERE f.follower_id = $1 AND u.profile_public
       ORDER BY f.created_at DESC`,
      // Xbox is admin-only for now: to anyone else it is not there at all (see canUseXbox).
      [auth.id, canUseXbox((await getServerSession(authOptions))?.user?.admin)],
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[follows GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/** Follows `{ username }`: a public profile, not your own. Following twice is fine. */
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  const body = (await req.json().catch(() => null)) as { username?: unknown } | null
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })

  if (!(await allowAttempt('follow', `user:${auth.id}`))) {
    return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
  }

  try {
    const target = await findPublicUser(username)
    // A private profile looks the same as none, as everywhere else.
    if (!target || !target.profilePublic) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    if (String(target.id) === String(auth.id)) return NextResponse.json({ error: 'self' }, { status: 400 })

    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM follows WHERE follower_id = $1', [auth.id])
    if (rows[0].n >= FOLLOWS_MAX) return NextResponse.json({ error: 'too-many-follows' }, { status: 409 })

    await pool.query(
      'INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [auth.id, target.id],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[follows POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/** Stops following `?username=`. Not following them already is not an error. */
export async function DELETE(req: NextRequest) {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  const username = req.nextUrl.searchParams.get('username')?.trim()
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })

  try {
    await pool.query(
      `DELETE FROM follows
       WHERE follower_id = $1 AND followed_id = (SELECT id FROM users WHERE LOWER(username) = LOWER($2))`,
      [auth.id, username],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[follows DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
