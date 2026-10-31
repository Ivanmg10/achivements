import { NextResponse, after } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { clearUserCache } from '@/lib/steamCache'
import { sendSteamLinkNotice } from '@/lib/steamLinkNotice'
import { forgetUnlocks } from '@/lib/steamUnlocks'
import { forgetUser } from '@/lib/userRecord'

export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    // The sign-in goes with the link. Who signed up through Steam can set a password with "forgot password".
    const { rows } = await pool.query(
      'UPDATE users SET steamid = NULL, steamusername = NULL, steam_login_id = NULL WHERE id = $1 RETURNING username, email',
      [auth.id],
    )
    const { username, email } = rows[0] ?? {}
    if (email) after(() => sendSteamLinkNotice({ to: email, username, linked: false }))
  } catch {
    return NextResponse.json({ message: 'Could not unlink Steam account' }, { status: 500 })
  }

  // Best effort: the link is already gone, so a stale cache row must not fail the request.
  await clearUserCache(auth.id)
  await forgetUnlocks(auth.id)
  forgetUser(auth.id)

  return NextResponse.json({ ok: true })
}
