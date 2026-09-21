import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getOwnedGames } from '@/lib/steamClient'
import { enrichWithAchievementCounts } from '@/lib/steamProgress'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type { SteamOwnedGamesResponse, SteamGameProgress } from '@/types/steam'

/**
 * How many library games get achievement counts. Libraries run to hundreds of
 * games and each count is one Steam call, so only the most recently played
 * are filled in — those are the ones a "playing"/"completed" split is about.
 */
const ENRICH_BUDGET = 30

function byLastPlayedDesc(a: SteamGameProgress, b: SteamGameProgress) {
  return (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')
}

/** The full library, most played first. */
export async function GET() {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const games = await withSteamCache<SteamGameProgress[]>(
      `steamOwned:${steamid}`,
      TTL.ownedGames,
      async () => {
        const data = (await getOwnedGames(steamid, apiKey)) as SteamOwnedGamesResponse
        // A private profile yields `{ response: {} }` rather than an error.
        const mapped = (data?.response?.games ?? []).map(toSteamGameProgress)
        // Spend the budget on the most recently played, then present by playtime.
        const enriched = await enrichWithAchievementCounts([...mapped].sort(byLastPlayedDesc), auth.session, ENRICH_BUDGET)
        return enriched.sort((a, b) => b.playtimeForever - a.playtimeForever)
      },
      { userId: id },
    )

    return cachedJson(games, TTL.ownedGames)
  } catch (err) {
    console.error('[steam/ownedGames]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
