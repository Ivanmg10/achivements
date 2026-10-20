import crypto from 'crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { takeWeeklySnapshot } from '@/lib/rankings'
import { refreshDueScores } from '@/lib/scoreRefresh'

/** The function may run this long; the refresh stops in time to answer. */
export const maxDuration = 60
const BUDGET_MS = 50_000

/**
 * Daily, from Vercel Cron (vercel.json): on the first run of a week, where
 * everyone stands (the rankings' arrows); then the scores of users never
 * scored, and of those seen in the last two weeks whose score is a day old.
 * Users on the site are refreshed by their own heartbeat as well.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without the variable the
 * route refuses everyone rather than running open.
 */
export async function GET(req: NextRequest) {
  const deadline = Date.now() + BUDGET_MS
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'cron-not-configured' }, { status: 503 })

  const given = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const snapshot = await takeWeeklySnapshot()
    const refreshed = await refreshDueScores(deadline)
    return NextResponse.json({ snapshot, refreshed })
  } catch (err) {
    console.error('[cron scores]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
