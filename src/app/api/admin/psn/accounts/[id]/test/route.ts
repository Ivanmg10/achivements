import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { loadPoolAccount } from '@/lib/psnAccounts'
import { checkPsnAccount } from '@/lib/psnAccountCheck'
import { dbId } from '@/utils/dbId'

/**
 * POST: the panel's "Test" (#178). The account signs in (refreshing its tokens when due) and reads its own
 * profile with its own token: who it is, and how long Sony took. 502 with `auth`, `rate-limited` or `failed`.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const id = dbId((await params).id)
  if (id === null) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  try {
    const account = await loadPoolAccount(id)
    if (!account) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    const check = await checkPsnAccount(account)
    await logAdminAction(auth.admin, 'psn-account-test', null, { accountId: id, label: account.label, ok: check.ok })
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 502 })
    return NextResponse.json({ onlineId: check.profile.onlineId, ms: check.ms })
  } catch (err) {
    console.error('[admin/psn/accounts test]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
