import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { daysLeft, loadPsnCredentials, npssoExpiry, savePsnNpsso, savePsnTokens } from '@/lib/psnCredentials'
import { forgetPsnTokens, verifyNpsso } from '@/lib/psnClient'

/** An NPSSO is 64 characters of letters and digits. */
const NPSSO = /^[A-Za-z0-9]{64}$/

/**
 * The app's PSN sign-in, for the admin panel: when the NPSSO dies, and the
 * form to paste a new one. Sony gives no way to extend an NPSSO (see
 * psnCredentials), so this is how it is renewed every ~2 months — no
 * redeploy, and the daily reminder (/api/cron/psnToken) says when.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const stored = await loadPsnCredentials()
    const expiresAt = stored?.npssoExpiresAt ?? null
    return NextResponse.json({
      configured: Boolean(stored?.npsso || process.env.PSN_NPSSO?.trim()),
      stored: Boolean(stored?.npsso),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      daysLeft: daysLeft(expiresAt),
      updatedAt: stored?.updatedAt ? new Date(stored.updatedAt).toISOString() : null,
      updatedBy: stored?.updatedBy ?? null,
    })
  } catch (err) {
    console.error('[admin/psn GET]', err)
    return NextResponse.json({ error: 'Could not read the PSN credentials' }, { status: 500 })
  }
}

// PUT { npsso }
export async function PUT(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const body = ((await req.json().catch(() => null)) ?? {}) as { npsso?: unknown }
  const npsso = typeof body.npsso === 'string' ? body.npsso.trim() : ''
  if (!NPSSO.test(npsso)) return NextResponse.json({ error: 'invalid-npsso' }, { status: 400 })

  // Sony has to accept it before it replaces a working one.
  const expiresAt = await npssoExpiry(npsso)
  if (expiresAt === null) return NextResponse.json({ error: 'rejected' }, { status: 422 })

  let tokens
  try {
    tokens = await verifyNpsso(npsso)
  } catch (err) {
    console.error('[admin/psn PUT] exchange', err)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
  // Sony said yes; a failure from here on is ours, not theirs.
  try {
    await savePsnNpsso(npsso, expiresAt, auth.admin.username)
    await savePsnTokens(tokens)
  } catch (err) {
    console.error('[admin/psn PUT] save', err)
    return NextResponse.json({ error: 'save-failed' }, { status: 500 })
  }
  forgetPsnTokens()

  const iso = new Date(expiresAt).toISOString()
  await logAdminAction(auth.admin, 'psn-token', null, { expiresAt: iso })
  return NextResponse.json({ expiresAt: iso, daysLeft: daysLeft(expiresAt) })
}
