import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { steamFailure } from '@/lib/steamFailure'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getRecentlyPlayedGames } from '@/lib/steamClient'
import { enrichWithAchievementCounts, isPrivateLibrary, loadOwnedGames, SteamPrivateError } from '@/lib/steamProgress'
import { lastPlayedGames, toSteamGameProgress } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type { SteamRecentlyPlayedResponse, SteamGameProgress } from '@/types/steam'
import { visibleGamesForUser } from '@/lib/gameVisibility'

const COUNT = 20

export async function GET(req?: Request) {
  const auth = await requireSteamSession(req)
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const games = await withSteamCache<SteamGameProgress[]>(
      // v3: games Steam does not date are dated by us (#113).
      `steamRecent:v3:${steamid}`,
      TTL.recentlyPlayed,
      async () => {
        // The games come from the owned list, by its last-played dates: Steam's
        // recent list covers only two weeks, so someone who stopped playing a
        // while ago got nothing. Every game of the recent list counts as played
        // in those two weeks; the ones the owned list lacks (a family-shared
        // game) go at the end.
        const [owned, recent] = await Promise.all([
          // A failed owned lookup still leaves the recent list, undated.
          loadOwnedGames(auth.session).catch((err) => {
            console.error('[steam/recentlyPlayed] owned', err)
            return null
          }),
          getRecentlyPlayedGames(steamid, apiKey, COUNT) as Promise<SteamRecentlyPlayedResponse>,
        ])
        const recentGames = new Map((recent?.response?.games ?? []).map((g) => [g.appid, g]))
        const ownedGames = (owned?.response?.games ?? []).map((g) =>
          recentGames.has(g.appid) && !g.playtime_2weeks ? { ...g, playtime_2weeks: recentGames.get(g.appid)!.playtime_2weeks } : g,
        )
        const ownedIds = new Set(ownedGames.map((g) => g.appid))
        const extra = [...recentGames.values()].filter((g) => !ownedIds.has(g.appid))
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

    // Visibility is a per-user projection over the canonical cache, never cached by the browser.
    const visible = await visibleGamesForUser(id, games, 'steam')
    return cachedJson(visible, 0)
  } catch (err) {
    if (err instanceof SteamPrivateError) return NextResponse.json({ error: 'private' }, { status: 403 })
    console.error('[steam/recentlyPlayed]', err)
    return steamFailure(err)
  }
}
