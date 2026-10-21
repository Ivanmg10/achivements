import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { linkReturn, siteBase, stateCookie, steamLoginUrl } from '@/lib/steamLogin'

/**
 * Off to Steam's sign-in, which comes back to the callback. `?intent=link`
 * (from the Steam card, signed in) links the account Steam confirms;
 * anything else signs in or signs up. `next` is where a link returns to.
 */
export function GET(req: NextRequest) {
  const base = siteBase(req.nextUrl.origin)
  const query = req.nextUrl.searchParams
  const state = crypto.randomBytes(16).toString('hex')
  const back = new URLSearchParams(
    query.get('intent') === 'link'
      ? { intent: 'link', next: linkReturn(query.get('next')), state }
      : { intent: 'signin', state },
  )
  return NextResponse.redirect(steamLoginUrl(base, back), {
    headers: { 'Set-Cookie': stateCookie(state, base.startsWith('https:')) },
  })
}
