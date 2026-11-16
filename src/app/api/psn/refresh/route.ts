import { NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { PRIORITY, psnJobsOf } from '@/lib/psnQueue'
import { lastChecked, REFRESH_MS } from '@/lib/psnSnapshot'
import { loadPsnPlayer } from '@/lib/psnStore'
import { requestPsnSync } from '@/lib/psnSync'

/**
 * Asks for a fresh PSN sync (#179): 202 `queued` (first in line after links); 409 `syncing` while the summary or
 * the list is already being read; 429 `too-soon` within REFRESH_MS of the last check, with `Retry-After`.
 */
export async function POST() {
  const auth = await requirePsnSession()
  if (!auth.ok) return auth.response
  const { id, psnaccountid } = auth.session
  try {
    const jobs = await psnJobsOf(id)
    if (jobs.some((j) => j.phase === 'summary' || j.phase === 'titles')) return NextResponse.json({ error: 'syncing' }, { status: 409 })
    const player = await loadPsnPlayer(psnaccountid)
    const checked = player ? lastChecked(player) : null
    const wait = checked === null ? 0 : checked + REFRESH_MS - Date.now()
    if (wait > 0) return NextResponse.json({ error: 'too-soon' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(wait / 1000)) } })
    await requestPsnSync(id, PRIORITY.manual)
    return NextResponse.json({ status: 'queued' }, { status: 202 })
  } catch (err) {
    console.error('[psn/refresh]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
