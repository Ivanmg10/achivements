import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cronRefusal } from '@/lib/secrets'
import { drainPsnQueue, sweepPsnJobs } from '@/lib/psnQueue'
import { enqueueDuePsnSyncs, runPsnJob, sweepPsnPlayers } from '@/lib/psnSync'

export const maxDuration = 60
/** The drain stops in time to answer. */
const BUDGET_MS = 55_000

/**
 * The PSN sync worker (#179): queues a sync for every account seen in the last two weeks and not checked in 20
 * hours, sweeps old jobs and the rows of accounts nobody links any more, then runs the queue until its time is up.
 *
 * Vercel's Hobby plan runs it once a day (vercel.json); the queue is also drained after PSN traffic
 * (psnSync.kickPsnSync), which is what keeps it moving. On a Pro plan, schedule it `* * * * *`.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without the variable the route refuses everyone.
 */
export async function GET(req: NextRequest) {
  const deadline = Date.now() + BUDGET_MS
  const refused = cronRefusal(req)
  if (refused) return refused
  try {
    const queued = await enqueueDuePsnSyncs()
    await Promise.all([sweepPsnJobs(), sweepPsnPlayers()])
    const ran = await drainPsnQueue(runPsnJob, deadline)
    return NextResponse.json({ queued, ran })
  } catch (err) {
    console.error('[cron psn-worker]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
