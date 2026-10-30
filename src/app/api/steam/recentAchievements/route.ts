import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { loadRecentAchievements } from '@/lib/steamRecentAchievements'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { cachedJson } from '@/lib/httpCache'
import type { SteamRecentAchievement } from '@/types/steam'
import { visibleGamesForUser } from '@/lib/gameVisibility'

/** The player's latest Steam unlocks, for the profile column — like RA's recent achievements. */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession(req)
  if (!auth.ok) return auth.response
  const { id, steamid } = auth.session
  const lang = parseSteamLanguage(req.nextUrl.searchParams.get('lang'))

  try {
    const achievements = await withSteamCache<SteamRecentAchievement[]>(
      `steamRecentAch:${steamid}:${lang}`,
      TTL.recentlyPlayed,
      () => loadRecentAchievements(auth.session, lang),
      { userId: id, refreshable: true },
    )
    const visible = await visibleGamesForUser(id, achievements, 'steam', (achievement) => achievement.appId)
    return cachedJson(visible, 0)
  } catch (err) {
    console.error('[steam/recentAchievements]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
