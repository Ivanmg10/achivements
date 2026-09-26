import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Everything inside the app needs an account. The home page is the exception:
 * signed out it shows the landing page, which is what tells a visitor what
 * CheevoVault is before asking them to sign up.
 */
const PUBLIC_PATHS = ['/', '/authPage']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (token) return NextResponse.next()

  const signIn = new URL('/authPage', req.url)
  return NextResponse.redirect(signIn)
}

export const config = {
  // Everything but the API, Next's own files, and anything with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|media|.*\\..*).*)'],
}
