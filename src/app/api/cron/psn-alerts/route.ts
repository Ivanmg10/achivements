import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cronRefusal } from '@/lib/secrets'
import { runPsnMaintenance } from '@/lib/psnMaintenance'

export const maxDuration = 60

/**
 * The PSN pool's upkeep and Telegram alerts (#178): pauses drained accounts, runs the canaries that are due and
 * sends what is due (an expiring sign-in, a quarantine, too many 429s, the pool down to one account, failing
 * syncs) plus the daily digest after 09:00 UTC, once each. Scheduled daily in vercel.json; PSN traffic also runs
 * it every 15 minutes (psnMaintenance). Without Telegram, `/api/cron/psnToken` mails the admins instead.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without the variable the route refuses everyone.
 */
export async function GET(req: NextRequest) {
  const refused = cronRefusal(req)
  if (refused) return refused
  try {
    return NextResponse.json(await runPsnMaintenance())
  } catch (err) {
    console.error('[cron psn-alerts]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
