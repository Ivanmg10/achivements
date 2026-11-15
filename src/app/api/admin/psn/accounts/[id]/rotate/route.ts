import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { renewPsnAccount } from '@/lib/psnAccounts'
import { tryPsnNpsso } from '@/lib/psnAccountCheck'
import { forgetPsnTokens } from '@/lib/psnTokens'
import { readNpsso } from '@/utils/psnAccountInput'
import { dbId } from '@/utils/dbId'

/**
 * POST { npsso }: the panel's "Renew" (#178). Sony fixes an NPSSO at 60 days and offers no way to extend it, so a
 * person signs in to the account again and pastes the new one. It replaces the old only once it works (Sony takes
 * it and the account reads its own profile): until then the old one keeps serving. Never answered back or logged.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const id = dbId((await params).id)
  const npsso = readNpsso(await req.json().catch(() => null))
  if (id === null) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  if (!npsso) return NextResponse.json({ error: 'invalid-npsso' }, { status: 400 })

  const signIn = await tryPsnNpsso(npsso)
  if (signIn === 'rejected') return NextResponse.json({ error: 'rejected' }, { status: 422 })
  if (signIn === 'failed') return NextResponse.json({ error: 'failed' }, { status: 502 })

  try {
    if (!(await renewPsnAccount(id, auth.admin.username, signIn))) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  } catch (err) {
    console.error('[admin/psn/accounts rotate] save', err)
    return NextResponse.json({ error: 'save-failed' }, { status: 500 })
  }
  forgetPsnTokens()
  const expiresAt = new Date(signIn.expiresAt).toISOString()
  await logAdminAction(auth.admin, 'psn-account-renew', null, { accountId: id, expiresAt })
  return NextResponse.json({ onlineId: signIn.onlineId, expiresAt })
}
