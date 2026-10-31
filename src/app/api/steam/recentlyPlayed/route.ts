import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { steamFailure } from '@/lib/steamFailure'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getRecentlyPlayedGames } from '@/lib/steamClient'
import { enrichWithAchievementCounts, isPrivateLibrary, loadOwnedGames, SteamPrivateError } from '@/lib/steamProgress'
import { lastPlayedGames, toSteamGameProgress } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type { SteamRecentlyPlayedResponse, SteamGameProgress } from '@/types/steam'

const COUNT = 20

export async function GET(req?: Request) {
  const auth = await requireSteamSession(req)
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const games = await withSteamCache<SteamGameProgress[]>(
      `steamRecent:v2:${steamid}`,
      TTL.recentlyPlayed,
      async () => {
        // The games come from the owned list, by its last-played dates: Steam's
        // recent list covers only two weeks, so someone who stopped playing a
        // while ago got nothing. The recent list still adds the games played
        // lately that the owned list lacks (a family-shared game), at the end.
        const [owned, recent] = await Promise.all([
          // A failed owned lookup still leaves the recent list, undated.
          loadOwnedGames(auth.session).catch((err) => {
            console.error('[steam/recentlyPlayed] owned', err)
            return null
          }),
          getRecentlyPlayedGames(steamid, apiKey, COUNT) as Promise<SteamRecentlyPlayedResponse>,
        ])
        const ownedGames = owned?.response?.games ?? []
        const ownedIds = new Set(ownedGames.map((g) => g.appid))
        const extra = (recent?.response?.games ?? []).filter((g) => !ownedIds.has(g.appid))
        // A private profile, linked anyway (a link proves ownership, not visibility): say so,
        // like the library does, instead of an empty list that looks like "nothing played".
        if (owned && isPrivateLibrary(owned) && extra.length === 0) throw new SteamPrivateError()
        const mapped = [...lastPlayedGames(ownedGames, COUNT), ...extra]
          .slice(0, COUNT)
          .map(toSteamGameProgress)
        // The initial feed: counts for every recent game (≤20 calls, shared with the library cache).
        return (await enrichWithAchievementCounts(mapped, auth.session, COUNT)).games
      },
      { userId: id, refreshable: true },
    )

    // Not browser-cached — see ownedGames; the DB cache keeps it cheap.
    return cachedJson(games, 0)
  } catch (err) {
    if (err instanceof SteamPrivateError) return NextResponse.json({ error: 'private' }, { status: 403 })
    console.error('[steam/recentlyPlayed]', err)
    return steamFailure(err)
  }
}
