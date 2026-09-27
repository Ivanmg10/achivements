import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { loadActivityAchievements } from '@/lib/steamRecentAchievements'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { cachedJson } from '@/lib/httpCache'
import type { SteamRecentAchievement } from '@/types/steam'

/** Every Steam unlock of the last 60 days — the main page's activity charts in Steam mode. */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid } = auth.session
  const lang = parseSteamLanguage(req.nextUrl.searchParams.get('lang'))

  try {
    const achievements = await withSteamCache<SteamRecentAchievement[]>(
      `steamActivity:${steamid}:${lang}`,
      TTL.recentlyPlayed,
      () => loadActivityAchievements(auth.session, lang),
      { userId: id },
    )
    // Not browser-cached, like the other Steam lists; the DB cache keeps it cheap.
    return cachedJson(achievements, 0)
  } catch (err) {
    console.error('[steam/activity]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
