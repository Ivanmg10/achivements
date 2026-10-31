import { NextResponse } from 'next/server'
import { ELEVATION_MS, elevationCookie, logAdminAction, requireAdminRole, signElevation } from '@/lib/adminAuth'
import { checkSecondFactor } from '@/lib/adminTotp'
import { checkCurrentPassword } from '@/lib/currentPassword'

/**
 * Unlocks the admin panel for ELEVATION_MS with the admin's own password,
 * counted against the same limit as every other current-password check, and a
 * one-time code. An admin with no authenticator yet gets its key here, once the
 * password is right, and enrols with their first code.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminRole()
    if (!auth.ok) return auth.response
    const { admin } = auth

    const { password, code } = ((await req.json().catch(() => null)) ?? {}) as { password?: unknown; code?: unknown }
    const check = await checkCurrentPassword(admin.id, password)
    if (check === 'too-many') return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
    if (check === 'no-user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (check === 'wrong') {
      await logAdminAction(admin, 'unlock-failed', null)
      return NextResponse.json({ error: 'wrong-password' }, { status: 403 })
    }

    const second = await checkSecondFactor(admin.id, admin.username, code)
    if (second.state === 'too-many') return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
    if (second.state === 'required') return NextResponse.json({ error: 'totp-required' }, { status: 403 })
    if (second.state === 'setup') {
      return NextResponse.json({ error: 'totp-setup', key: second.key, uri: second.uri, wrong: second.wrong }, { status: 403 })
    }
    if (second.state === 'wrong') {
      await logAdminAction(admin, 'unlock-failed', null)
      return NextResponse.json({ error: 'wrong-code' }, { status: 403 })
    }

    const expiresAt = Date.now() + ELEVATION_MS
    if (second.recoveryCodes) await logAdminAction(admin, 'totp-enrolled', null)
    await logAdminAction(admin, 'unlock', null)
    return NextResponse.json(
      { ok: true, expiresAt, recoveryCodes: second.recoveryCodes },
      { headers: { 'Set-Cookie': elevationCookie(signElevation(admin.id, admin.pwv, expiresAt)) } },
    )
  } catch (err) {
    console.error('[admin/unlock POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/** Locks the panel again before the time runs out. */
export async function DELETE() {
  return NextResponse.json({ ok: true }, { headers: { 'Set-Cookie': elevationCookie(null) } })
}
