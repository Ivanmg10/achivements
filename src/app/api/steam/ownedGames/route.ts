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

class SteamPrivateError extends Error {
  constructor() {
    super('The Steam profile is not public')
  }
}

function byLastPlayedDesc(a: SteamGameProgress, b: SteamGameProgress) {
  return (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')
}

/** The full library, most played first. */
export async function GET(req?: Request) {
  const auth = await requireSteamSession(req)
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    let complete = true
    const games = await withSteamCache<SteamGameProgress[]>(
      // v2: games carry lastUnlock. A shared DB lets an older build rewrite the old shape under the old key.
      `steamOwned2:${steamid}`,
      TTL.ownedGames,
      async () => {
        const data = (await getOwnedGames(steamid, apiKey)) as SteamOwnedGamesResponse
        // A private or friends-only profile — or public with its game details private — yields
        // `{ response: {} }` rather than an error (measured 2026-10-16); a public account with no
        // games carries `game_count`. So a profile made private after it was linked is told apart
        // from an empty library, and not cached as one.
        // ponytail: a public account with no games and no game_count would read as private; unverified.
        if (!data?.response?.games && typeof data?.response?.game_count !== 'number') throw new SteamPrivateError()
        const mapped = (data?.response?.games ?? []).map(toSteamGameProgress)
        // Newest first, so a partial fill covers what was played most recently.
        const result = await enrichWithAchievementCounts([...mapped].sort(byLastPlayedDesc), auth.session, MAX_FETCHES)
        complete = result.complete
        return result.games.sort((a, b) => b.playtimeForever - a.playtimeForever)
      },
      // An unfinished fill is not cached, so the next request carries on with it.
      { userId: id, shouldCache: () => complete, refreshable: true },
    )

    // No browser caching: the list changes as counts fill in, and a copy held
    // by the browser for an hour froze a partial fill in place. The DB cache
    // above is what keeps repeat requests cheap.
    return cachedJson(games, 0)
  } catch (err) {
    if (err instanceof SteamPrivateError) return NextResponse.json({ error: 'private' }, { status: 403 })
    console.error('[steam/ownedGames]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
