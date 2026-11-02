import { withSteamCache, TTL } from '@/lib/steamCache'
import { loadActivityAchievements } from '@/lib/steamRecentAchievements'
import type { SteamAuth } from '@/lib/steamProgress'
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
 * game, so this is the expensive one and it is cached for half an hour. Shared
 * by `/api/steam/unlockYear` and the header's streak, so both read one cache.
 */
export function loadSteamYear(auth: SteamAuth, lang: string): Promise<SteamRecentAchievement[]> {
  return withSteamCache<SteamRecentAchievement[]>(
    `steamUnlockYear:${auth.steamid}:${lang}`,
    TTL.unlockYear,
    () => loadActivityAchievements(auth, lang, DAYS, Date.now(), GAMES),
    { userId: auth.id },
  )
}
