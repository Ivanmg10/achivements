import crypto from 'crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'cron-not-configured' }, { status: 503 })

  const given = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deleted = await sweepExpired()
    return NextResponse.json({ deleted })
  } catch (err) {
    console.error('[cron sweepCache]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
