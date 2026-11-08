import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cronRefusal } from '@/lib/secrets'
import { sweepExpired } from '@/lib/steamCache'

/**
 * Daily, from Vercel Cron (vercel.json): deletes expired steam_cache rows.
 * Reads already skip them, so nothing user-facing changes — it only stops
 * the table growing until the database runs out of space.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without the variable the
 * route refuses everyone rather than running open.
 */
export async function GET(req: NextRequest) {
  const refused = cronRefusal(req)
  if (refused) return refused

  try {
    const deleted = await sweepExpired()
    return NextResponse.json({ deleted })
  } catch (err) {
    console.error('[cron sweepCache]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
