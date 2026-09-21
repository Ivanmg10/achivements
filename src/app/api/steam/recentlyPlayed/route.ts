import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getRecentlyPlayedGames } from '@/lib/steamClient'
import { enrichWithAchievementCounts, loadLastPlayedDates } from '@/lib/steamProgress'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type { SteamRecentlyPlayedResponse, SteamGameProgress } from '@/types/steam'

const COUNT = 20

function byLastPlayedDesc(a: SteamGameProgress, b: SteamGameProgress) {
  return (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')
}

export async function GET() {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const games = await withSteamCache<SteamGameProgress[]>(
      `steamRecent:${steamid}`,
      TTL.recentlyPlayed,
      async () => {
        // Recent games come without a last-played date, so it is looked up in
        // the owned list — inside this 5-minute cache, so the dates stay fresh.
        const [data, lastPlayed] = await Promise.all([
          getRecentlyPlayedGames(steamid, apiKey, COUNT) as Promise<SteamRecentlyPlayedResponse>,
          loadLastPlayedDates(auth.session),
        ])
        // A player with nothing played in two weeks gets `{ response: {} }`.
        const mapped = (data?.response?.games ?? [])
          .map((g) => toSteamGameProgress({ ...g, rtime_last_played: g.rtime_last_played ?? lastPlayed.get(g.appid) }))
          // Steam orders these by recent playtime, not by date.
          .sort(byLastPlayedDesc)
        // The initial feed: counts for every recent game (≤20 calls, each cached 1h).
        return enrichWithAchievementCounts(mapped, auth.session, COUNT)
      },
      { userId: id },
    )

    return cachedJson(games, TTL.recentlyPlayed)
  } catch (err) {
    console.error('[steam/recentlyPlayed]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
