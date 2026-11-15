import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { cachedJson } from '@/lib/httpCache'
import { loadStreak, parseHiddenConsoles, StreakUnavailable } from '@/lib/meStreak'

/**
 * The signed-in user's current and best streak, for the header (see loadStreak).
 * Only ever the viewer's own: it reads the session, never `?user=`, so it cannot
 * spend anyone else's RA key. `lang` keeps the platforms' caches the ones the
 * pages fill; `hidden` is the consoles unticked in this browser.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSession({ error: 'unauthorized', retryable: false })
  if (!auth.ok) return auth.response

  const params = req.nextUrl.searchParams
  const hidden = parseHiddenConsoles(params.get('hidden'))
  if (!hidden) return NextResponse.json({ error: 'invalid-hidden', retryable: false }, { status: 400 })

  try {
    const streak = await loadStreak({ ...auth.user, id: String(auth.id) }, params.get('lang') ?? 'en', hidden)
    return cachedJson(streak, 0)
  } catch (err) {
    // A 5xx, so the client asks again: every platform failing is "try later", not "no streak".
    const failed = err instanceof StreakUnavailable ? err.failed : []
    if (!failed.length) console.error('[me/streak]', err)
    return NextResponse.json({ error: 'upstream', retryable: true, failed }, { status: 502 })
  }
}
