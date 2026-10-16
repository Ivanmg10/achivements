import { NextRequest, NextResponse } from 'next/server'
import { cachedJson } from '@/lib/httpCache'
import { requireXboxSession } from '@/lib/apiAuth'
import { xboxFailure, xboxLanguage, xboxLatestAchievements, xboxRecentAchievements } from '@/lib/xboxClient'

/** How long the browser may keep an answer: short, as these change as the person plays. */
const BROWSER_TTL_MS = 2 * 60 * 1000

/** Days each scope looks back — the same windows as Steam's and PSN's. */
const DAYS = { activity: 60, year: 366 } as const

/**
 * The signed-in user's Xbox achievements: `recent` — the latest few, for the
 * profile column; `activity` — the last 60 days, for the main page's charts;
 * `year` — the last year, for the streak and the heatmap.
 */
export async function GET(req: NextRequest) {
  const auth = await requireXboxSession(req)
  if (!auth.ok) return auth.response
  const { id, xboxxuid } = auth.session

  const scope = req.nextUrl.searchParams.get('scope') ?? 'recent'
  // Achievement names in the app's language.
  const language = xboxLanguage(req.nextUrl.searchParams.get('lang'))
  if (scope !== 'recent' && scope !== 'activity' && scope !== 'year') {
    return NextResponse.json({ error: 'invalid-scope' }, { status: 400 })
  }

  try {
    const achievements =
      scope === 'recent'
        ? await xboxLatestAchievements(xboxxuid, id, language)
        : await xboxRecentAchievements(xboxxuid, scope, DAYS[scope], id, language)
    return cachedJson(achievements, BROWSER_TTL_MS)
  } catch (err) {
    return xboxFailure(err, 'xbox/recentAchievements')
  }
}
