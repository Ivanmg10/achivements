import { NextResponse } from 'next/server'
import { ELEVATION_MS, elevationCookie, logAdminAction, requireAdminRole, signElevation } from '@/lib/adminAuth'
import { checkCurrentPassword } from '@/lib/currentPassword'

/**
 * Unlocks the admin panel for ELEVATION_MS with the admin's own password —
 * counted against the same limit as every other current-password check.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminRole()
    if (!auth.ok) return auth.response
    const { admin } = auth

    const { password } = ((await req.json().catch(() => null)) ?? {}) as { password?: unknown }
    const check = await checkCurrentPassword(admin.id, password)
    if (check === 'too-many') return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
    if (check === 'no-user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (check === 'wrong') return NextResponse.json({ error: 'wrong-password' }, { status: 403 })

    const expiresAt = Date.now() + ELEVATION_MS
    await logAdminAction(admin, 'unlock', null)
    return NextResponse.json(
      { ok: true, expiresAt },
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
