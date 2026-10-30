import { NextRequest, NextResponse, after } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { steamApiKey } from '@/lib/fetchSteam'
import { getPlayerSummaries } from '@/lib/steamClient'
import { onPlatformLinked } from '@/lib/scoreRefresh'
import { sendSteamLinkNotice } from '@/lib/steamLinkNotice'
import { forgetUser } from '@/lib/userRecord'
import {
  cookieFromHeader,
  expiredStateCookie,
  linkReturn,
  returnParams,
  siteBase,
  signTicket,
  STEAM_STATE_COOKIE,
  ticketCookie,
  verifySteamLogin,
} from '@/lib/steamLogin'

/** The Steam name, for the card; a link stands without it. */
async function personaOf(steamid: string): Promise<string | null> {
  const key = steamApiKey()
  if (!key) return null
  try {
    const data = (await getPlayerSummaries(steamid, key)) as { response?: { players?: { personaname?: string }[] } }
    return data?.response?.players?.[0]?.personaname || null
  } catch (err) {
    console.error('[auth/steam] persona', err)
    return null
  }
}

/**
 * Links the Steam account Steam confirmed to the signed-in user, proven, so it
 * also signs them in with Steam from now on. One Steam account belongs to one
 * user here: another user's proven link wins ('taken').
 */
async function linkSteam(userId: string, steamid: string): Promise<'linked' | 'taken' | 'failed'> {
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE steam_login_id = $1', [steamid])
    if (rows.length > 0 && String(rows[0].id) !== userId) return 'taken'
    const updated = await pool.query(
      'UPDATE users SET steamid = $1, steamusername = $2, steam_login_id = $1 WHERE id = $3 RETURNING username, email',
      [steamid, await personaOf(steamid), userId],
    )
    const { username, email } = updated.rows[0] ?? {}
    // It adds a way in that a new password does not end: the owner must hear about it.
    if (email) after(() => sendSteamLinkNotice({ to: email, username, linked: true }))
  } catch (err) {
    if ((err as { code?: string }).code === '23505') return 'taken'
    console.error('[auth/steam] link', err)
    return 'failed'
  }
  forgetUser(userId)
  await onPlatformLinked(Number(userId), 'steam')
  return 'linked'
}

/**
 * Where Steam sends the user back. Nothing is done unless Steam confirms the
 * answer and the state matches this browser's. A sign-in leaves a ticket cookie
 * and goes on to /authPage?steam=1; a link returns to the card with
 * #steam-linked, #steam-taken or #steam-failed.
 */
export async function GET(req: NextRequest) {
  const base = siteBase(req.nextUrl.origin)
  const query = req.nextUrl.searchParams
  // Read before verifying only to pick where an error goes, among fixed places.
  const back = returnParams(query)
  const linking = back.get('intent') === 'link'
  const next = linkReturn(back.get('next'))
  const fail = (reason: 'failed' | 'unavailable') =>
    NextResponse.redirect(linking ? `${base}${next}#steam-${reason === 'unavailable' ? 'failed' : reason}` : `${base}/authPage?steam=${reason}`)

  let steamid: string | null
  try {
    steamid = await verifySteamLogin(query, base)
  } catch (err) {
    console.error('[auth/steam] verify', err)
    return fail('unavailable')
  }
  const state = cookieFromHeader(req.headers.get('cookie'), STEAM_STATE_COOKIE)
  if (!steamid || !state || back.get('state') !== state) return fail('failed')

  const secure = base.startsWith('https:')
  if (linking) {
    const auth = await requireSession()
    if (!auth.ok) return NextResponse.redirect(`${base}/authPage`)
    const res = NextResponse.redirect(`${base}${next}#steam-${await linkSteam(auth.id, steamid)}`)
    res.headers.append('Set-Cookie', expiredStateCookie(secure))
    return res
  }

  const res = NextResponse.redirect(`${base}/authPage?steam=1`)
  res.headers.append('Set-Cookie', ticketCookie(signTicket(steamid), secure))
  res.headers.append('Set-Cookie', expiredStateCookie(secure))
  return res
}
