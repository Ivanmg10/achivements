import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getOwnedGames } from '@/lib/steamClient'
import { enrichWithAchievementCounts } from '@/lib/steamProgress'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type { SteamOwnedGamesResponse, SteamGameProgress } from '@/types/steam'

/**
 * New Steam calls per request. Every played game with achievements gets
 * counted — a library's completed games can be years old — but a first load
 * can mean hundreds of calls, so it is spread over several requests instead of
 * one that could run past a serverless timeout. Counts already cached cost no
 * call, so after the first fill only games played since are fetched.
 */
const MAX_FETCHES = 60

function byLastPlayedDesc(a: SteamGameProgress, b: SteamGameProgress) {
  return (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')
}

/** The full library, most played first. */
export async function GET() {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    let complete = true
    const games = await withSteamCache<SteamGameProgress[]>(
      `steamOwned:${steamid}`,
      TTL.ownedGames,
      async () => {
        const data = (await getOwnedGames(steamid, apiKey)) as SteamOwnedGamesResponse
        // A private profile yields `{ response: {} }` rather than an error.
        const mapped = (data?.response?.games ?? []).map(toSteamGameProgress)
        // Newest first, so a partial fill covers what was played most recently.
        const result = await enrichWithAchievementCounts([...mapped].sort(byLastPlayedDesc), auth.session, MAX_FETCHES)
        complete = result.complete
        return result.games.sort((a, b) => b.playtimeForever - a.playtimeForever)
      },
      // An unfinished fill is not cached, so the next request carries on with it.
      { userId: id, shouldCache: () => complete },
    )

    return cachedJson(games, complete ? TTL.ownedGames : 0)
  } catch (err) {
    console.error('[steam/ownedGames]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
