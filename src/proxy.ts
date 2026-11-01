import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Everything inside the app needs an account. The home page is the exception:
 * signed out it shows the landing page, which is what tells a visitor what
 * CheevoVault is before asking them to sign up.
 */
// /opengraph-image is the link preview and /apple-icon the iOS home-screen icon:
// whoever fetches them (other sites, a phone saving the page) has no session.
// /rankings and how its points work are public (signed out: no presence, no Following).
// TEMP (#102): /welcome is open only while its preferences are reworked, so it can be tried with no new account. Remove before that PR merges.
const PUBLIC_PATHS = ['/', '/authPage', '/resetPassword', '/privacy', '/terms', '/opengraph-image', '/apple-icon', '/rankings', '/rankings/how', '/welcome']
// The comparison and how-to pages (src/translations/seoPages.ts): written for visitors and crawlers.
const PUBLIC_PREFIXES = ['/compare/', '/track/']
// A profile and its link preview: signed out, the page shows only what the rankings do (profileTeaser).
// Not /user (your account) and not a game inside a profile.
const PUBLIC_PROFILE = /^\/user\/[^/]+(\/opengraph-image[^/]*)?$/

/**
 * A write from another site, which SameSite alone does not stop when that site
 * is a sibling subdomain. Only requests that carry Origin reach this (see the
 * matcher); a server calling the API sends none and is left to the route's own check.
 */
function crossSiteWrite(req: NextRequest): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return false
  const origin = req.headers.get('origin')
  try {
    return new URL(origin ?? '').host !== req.headers.get('host')
  } catch {
    return true
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api/')) {
    return crossSiteWrite(req) ? NextResponse.json({ error: 'cross-site' }, { status: 403 }) : NextResponse.next()
  }
  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || PUBLIC_PROFILE.test(pathname)) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (token) return NextResponse.next()

  const signIn = new URL('/authPage', req.url)
  return NextResponse.redirect(signIn)
}

export const config = {
  // Everything but the API, Next's own files, and anything with an extension.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|media|.*\\..*).*)',
    // Same-origin GETs send no Origin, so the API's reads never pass through here.
    { source: '/api/:path*', has: [{ type: 'header', key: 'origin' }] },
  ],
}
