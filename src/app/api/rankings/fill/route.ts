import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { continueFill, readFillStatus } from '@/lib/scoreRefresh'

/** A pass may read for this long; the route has room to answer after it. */
export const maxDuration = 120
const PASS_MS = 90_000

/**
 * The signed-in user's Vault Points fill. GET: how far it has got (null before
 * the first pass), cheap enough to poll while a pass runs. POST: run the next
 * pass if the score is unfinished or stale and no other pass is running, and
 * answer where it ended; the screens call it again until it is complete.
 */
export async function GET() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json(await readFillStatus(Number(auth.id)), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[rankings/fill GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json(await continueFill(Number(auth.id), PASS_MS), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[rankings/fill POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
