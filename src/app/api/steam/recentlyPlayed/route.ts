import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getRecentlyPlayedGames } from '@/lib/steamClient'
import { enrichWithAchievementCounts, loadOwnedFacts } from '@/lib/steamProgress'
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
        // Recent games come without a last-played date or a stats flag, so both
        // are looked up in the owned list — inside this 5-minute cache, so the
        // dates stay fresh.
        const [data, owned] = await Promise.all([
          getRecentlyPlayedGames(steamid, apiKey, COUNT) as Promise<SteamRecentlyPlayedResponse>,
          loadOwnedFacts(auth.session),
        ])
        // A player with nothing played in two weeks gets `{ response: {} }`.
        const mapped = (data?.response?.games ?? [])
          .map((g) => {
            const facts = owned.get(g.appid)
            return toSteamGameProgress({
              ...g,
              rtime_last_played: g.rtime_last_played ?? facts?.rtime_last_played,
              has_community_visible_stats: g.has_community_visible_stats ?? facts?.has_community_visible_stats,
            })
          })
          // Steam orders these by recent playtime, not by date.
          .sort(byLastPlayedDesc)
        // The initial feed: counts for every recent game (≤20 calls, shared with the library cache).
        return (await enrichWithAchievementCounts(mapped, auth.session, COUNT)).games
      },
      { userId: id },
    )

    // Not browser-cached — see ownedGames; the DB cache keeps it cheap.
    return cachedJson(games, 0)
  } catch (err) {
    console.error('[steam/recentlyPlayed]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
