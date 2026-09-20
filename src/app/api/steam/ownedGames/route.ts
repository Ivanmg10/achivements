import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getOwnedGames } from '@/lib/steamClient'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type { SteamOwnedGamesResponse, SteamGameProgress } from '@/types/steam'

/**
 * The full library. This is the deferred half of the load strategy — one call,
 * no per-game achievement lookups, so it stays cheap regardless of library size.
 */
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
        return (data?.response?.games ?? [])
          .map(toSteamGameProgress)
          .sort((a, b) => b.playtimeForever - a.playtimeForever)
      },
      { userId: id },
    )

    return cachedJson(games, TTL.ownedGames)
  } catch (err) {
    console.error('[steam/ownedGames]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
