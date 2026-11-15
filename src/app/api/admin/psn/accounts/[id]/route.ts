import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { deletePsnAccount, updatePsnAccount } from '@/lib/psnAccounts'
import { forgetPsnTokens } from '@/lib/psnTokens'
import { readAccountPatch } from '@/utils/psnAccountInput'
import { dbId } from '@/utils/dbId'

type Params = { params: Promise<{ id: string }> }

/**
 * One PSN service account (#178). PATCH { status?, weight?, concurrency?, ratePerMin?, hint? }: pause, drain
 * (finish what it has, take no more), resume, or tune it. DELETE: removes it and its secrets for good.
 */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const id = dbId((await params).id)
  const patch = readAccountPatch(await req.json().catch(() => null))
  if (id === null || patch === 'invalid') return NextResponse.json({ error: 'invalid' }, { status: 400 })

  try {
    if (!(await updatePsnAccount(id, patch))) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  } catch (err) {
    console.error('[admin/psn/accounts PATCH]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
  await logAdminAction(auth.admin, 'psn-account-update', null, { accountId: id, ...patch })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const id = dbId((await params).id)
  if (id === null) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  try {
    if (!(await deletePsnAccount(id))) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  } catch (err) {
    console.error('[admin/psn/accounts DELETE]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
  forgetPsnTokens()
  await logAdminAction(auth.admin, 'psn-account-remove', null, { accountId: id })
  return NextResponse.json({ ok: true })
}
