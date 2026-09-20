import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { buildAuthUrl, signState, configuredOrigin } from '@/lib/steamOpenId'

/**
 * Starts Steam account linking for the signed-in user. Steam is linked onto an
 * existing account (like RA) rather than being a sign-in provider, so this is a
 * plain redirect route, not a next-auth provider.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/authPage', configuredOrigin() ?? 'http://localhost:3000'))
  }

  const origin = configuredOrigin()
  if (!origin) {
    return NextResponse.json({ message: 'NEXTAUTH_URL is not configured' }, { status: 503 })
  }

  const returnTo = new URL('/api/steam/callback', origin)
  returnTo.searchParams.set('state', signState(session.user.id))

  return NextResponse.redirect(buildAuthUrl(returnTo.toString(), `${origin}/`))
}
