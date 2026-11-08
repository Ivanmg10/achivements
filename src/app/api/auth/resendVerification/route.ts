import { NextRequest, NextResponse, after } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { allowAttempt, clientAddress } from '@/lib/attemptLimit'
import { emailConfigured } from '@/lib/email'
import { loadUser } from '@/lib/userRecord'
import { sendVerificationEmail } from '@/lib/verificationEmail'

/**
 * Sends the verification link again, to the address on the account — never to
 * one supplied in the request, which would turn this into a way to mail
 * strangers from our domain.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSession({ error: 'unauthorized' })
  if (!auth.ok) return auth.response

  if (!emailConfigured()) {
    return NextResponse.json({ error: 'email-not-configured' }, { status: 503 })
  }

  if (!(await allowAttempt('reset', clientAddress(req.headers)))) {
    return NextResponse.json({ error: 'too-many-requests' }, { status: 429 })
  }

  const user = await loadUser(auth.id, { fresh: true })
  if (!user?.email) {
    return NextResponse.json({ error: 'no-email' }, { status: 400 })
  }
  if (user.email_verified_at) {
    return NextResponse.json({ ok: true, alreadyVerified: true })
  }

  after(() => sendVerificationEmail(user.id, user.username, user.email as string))

  return NextResponse.json({ ok: true })
}
