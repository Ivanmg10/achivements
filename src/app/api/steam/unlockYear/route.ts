import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { loadActivityAchievements } from '@/lib/steamRecentAchievements'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { cachedJson } from '@/lib/httpCache'
import type { SteamRecentAchievement } from '@/types/steam'

/** A year back, which is as far as the streak page looks. */
const DAYS = 365

/**
 * More games than the 60-day activity scan, since a year holds more of them,
 * and each one costs an unlock-list call.
 */
const GAMES = 80

/**
 * Every Steam unlock of the last year — what the streak is built from. RA
 * answers the same question in one call; Steam has to be assembled game by
 * game, so this is the expensive one and it is cached for half an hour.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession(req)
  if (!auth.ok) return auth.response
  const { id, steamid } = auth.session
  const lang = parseSteamLanguage(req.nextUrl.searchParams.get('lang'))

  try {
    const achievements = await withSteamCache<SteamRecentAchievement[]>(
      `steamUnlockYear:${steamid}:${lang}`,
      TTL.unlockYear,
      () => loadActivityAchievements(auth.session, lang, DAYS, Date.now(), GAMES),
      { userId: id },
    )
    // Not browser-cached, like the other Steam lists; the DB cache keeps it cheap.
    return cachedJson(achievements, 0)
  } catch (err) {
    console.error('[steam/unlockYear]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
