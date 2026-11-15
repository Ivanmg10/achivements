import { NextResponse } from 'next/server'
import { allowAttempt, clientAddress } from '@/lib/attemptLimit'
import { opsView, psnPoolStatus } from '@/lib/psnPoolStatus'
import { sameText } from '@/lib/secrets'

/**
 * GET: the PSN pool's state for the owner's own agent (Hermes) to read when asked "how is the PSN pool?" (#178).
 * `Authorization: Bearer <PSN_STATUS_TOKEN>`; without the variable the route does not exist (404). Read-only,
 * and only what is not secret: labels, states, days left on each sign-in, calls and 429s in the last hour, the
 * canary, cooldowns and sync failures. Never a token, an NPSSO, an e-mail, an online ID or a user.
 */
export async function GET(req: Request) {
  const token = process.env.PSN_STATUS_TOKEN?.trim()
  if (!token) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  // Counted before the check, wrong tokens too: the limit is what stops guessing.
  if (!(await allowAttempt('psn-status', clientAddress(req.headers)))) {
    return NextResponse.json({ error: 'too-many' }, { status: 429, headers: { 'Retry-After': '900' } })
  }
  if (!sameText(req.headers.get('authorization') ?? '', `Bearer ${token}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(opsView(await psnPoolStatus()), { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[ops/psn/status]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
