import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { psnPoolStatus } from '@/lib/psnPoolStatus'

/** GET: the PSN pool at a glance (#178): usable accounts, 429s, the next sign-in to die and when to renew it. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response
  try {
    const { pool } = await psnPoolStatus()
    return NextResponse.json({ pool }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[admin/psn/pool]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
