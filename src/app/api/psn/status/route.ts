import { NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { cachedJson } from '@/lib/httpCache'
import { psnSyncState } from '@/lib/psnSnapshot'

/**
 * Where the PSN sync stands (#179): `new` (nothing stored yet), `syncing`, `ready` or `private`, when Sony was last
 * checked and when the refresh button may check again, the games waiting for their trophies, the jobs in the
 * queue. Database only; it queues nothing.
 */
export async function GET(req: Request) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response
  try {
    return cachedJson(await psnSyncState(auth.session.psnaccountid, auth.session.id), 0)
  } catch (err) {
    console.error('[psn/status]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
