import { NextRequest, NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure, psnLanguage, psnLatestTrophies, psnRecentTrophies } from '@/lib/psnClient'

/** Days each scope looks back — the same windows as Steam's activity and year. */
const DAYS = { activity: 60, year: 366 } as const

/**
 * The signed-in user's PSN trophies: `recent` — the latest few, for the
 * profile column; `activity` — the last 60 days, for the main page's charts;
 * `year` — the last year, for the streak and the heatmap.
 */
export async function GET(req: NextRequest) {
  const auth = await requirePsnSession()
  if (!auth.ok) return auth.response
  const { id, psnaccountid } = auth.session

  const scope = req.nextUrl.searchParams.get('scope') ?? 'recent'
  // Trophy names in the app's language.
  const language = psnLanguage(req.nextUrl.searchParams.get('lang'))
  if (scope !== 'recent' && scope !== 'activity' && scope !== 'year') {
    return NextResponse.json({ error: 'invalid-scope' }, { status: 400 })
  }

  try {
    const trophies =
      scope === 'recent'
        ? await psnLatestTrophies(psnaccountid, id, language)
        : await psnRecentTrophies(psnaccountid, DAYS[scope], id, language)
    return NextResponse.json(trophies)
  } catch (err) {
    return psnFailure(err, 'psn/recentTrophies')
  }
}
