import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { insertPsnAccount } from '@/lib/psnAccounts'
import { tryPsnNpsso } from '@/lib/psnAccountCheck'
import { psnPoolStatus } from '@/lib/psnPoolStatus'
import { psnMode, psnPoolEnabled } from '@/lib/psnMode'
import { readNewAccount } from '@/utils/psnAccountInput'

/**
 * The PSN service accounts (#178) for the admin panel. GET: every account, the pool at a glance and its numbers,
 * and the PSN switches this deployment runs with (#180), never a secret. POST { label, hint?, weight?, npsso }: adds an account, only once Sony has taken its NPSSO and it has
 * read its own profile. The NPSSO is never answered back or logged.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response
  try {
    const switches = { mode: psnMode(), poolEnabled: psnPoolEnabled() }
    return NextResponse.json({ ...(await psnPoolStatus()), switches }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[admin/psn/accounts GET]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const input = readNewAccount(await req.json().catch(() => null))
  if (input === 'invalid' || input === 'invalid-npsso') return NextResponse.json({ error: input }, { status: 400 })

  const signIn = await tryPsnNpsso(input.npsso)
  if (signIn === 'rejected') return NextResponse.json({ error: 'rejected' }, { status: 422 })
  if (signIn === 'failed') return NextResponse.json({ error: 'failed' }, { status: 502 })

  try {
    const id = await insertPsnAccount({ label: input.label, hint: input.hint, weight: input.weight, by: auth.admin.username }, signIn)
    const expiresAt = new Date(signIn.expiresAt).toISOString()
    await logAdminAction(auth.admin, 'psn-account-add', null, { label: input.label, expiresAt })
    return NextResponse.json({ id, onlineId: signIn.onlineId, expiresAt }, { status: 201 })
  } catch (err) {
    if ((err as { code?: string })?.code === '23505') return NextResponse.json({ error: 'label-taken' }, { status: 409 })
    console.error('[admin/psn/accounts POST] save', err)
    return NextResponse.json({ error: 'save-failed' }, { status: 500 })
  }
}
