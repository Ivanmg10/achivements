import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt, clientAddress } from '@/lib/attemptLimit'
import { fetchRaProfile, raAvatarUrl, validRaCredentials } from '@/lib/raProfile'

/**
 * Before signing up with RetroAchievements: whether RA accepts this username
 * and Web API key, and the name and picture the form fills in. Signed out, so
 * limited per address (`ra-check`). The sign-up checks it all again with RA;
 * nothing is kept here. A key that already links an account here is refused
 * now, not at the end of the form.
 *
 * RA cannot say whose key it is (measured 2026-10-23: any valid key reads any
 * user's profile), so this proves an RA account, not that the username is the
 * key's own; the same holds for linking from the account page.
 */
export async function POST(req: NextRequest) {
  let body: { username?: unknown; apiKey?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const { username, apiKey } = body
  if (!validRaCredentials(username, apiKey)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  try {
    if (!(await allowAttempt('ra-check', clientAddress(req.headers)))) {
      return NextResponse.json({ error: 'too-many' }, { status: 429 })
    }
    const key = (apiKey as string).trim()
    const taken = await pool.query('SELECT 1 FROM users WHERE raid = $1', [key])
    if (taken.rows.length > 0) return NextResponse.json({ error: 'key-in-use' }, { status: 409 })

    const fetched = await fetchRaProfile(username.trim(), key)
    if (!fetched.ok) return NextResponse.json({ error: fetched.error }, { status: fetched.status })
    const user = String(fetched.profile.User)
    return NextResponse.json({ user, avatar: raAvatarUrl(user) })
  } catch (err) {
    console.error('[auth/ra/check]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
