import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getRecentlyPlayedGames } from '@/lib/steamClient'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type { SteamRecentlyPlayedResponse, SteamGameProgress } from '@/types/steam'

const COUNT = 20

export async function GET() {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const games = await withSteamCache<SteamGameProgress[]>(
      `steamRecent:${steamid}`,
      TTL.recentlyPlayed,
      async () => {
        const data = (await getRecentlyPlayedGames(steamid, apiKey, COUNT)) as SteamRecentlyPlayedResponse
        // A player with nothing played in two weeks gets `{ response: {} }`.
        return (data?.response?.games ?? []).map(toSteamGameProgress)
      },
      { userId: id },
    )

    return cachedJson(games, TTL.recentlyPlayed)
  } catch (err) {
    console.error('[steam/recentlyPlayed]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
