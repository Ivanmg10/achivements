import { withSteamCache, TTL } from '@/lib/steamCache'
import { getPlayerAchievements } from '@/lib/steamClient'
import { withPlayerAchievementCounts } from '@/utils/steamMappers'
import type { SteamGameProgress, SteamPlayerAchievement, SteamPlayerAchievementsResponse } from '@/types/steam'

/** Parallel Steam calls per enrichment — keeps a burst well under the rate limit. */
const CONCURRENCY = 4

export type SteamAuth = { id: string; steamid: string; apiKey: string }

/**
 * The player's unlock list for one game, cached per player for an hour. The
 * achievements route and list enrichment share this cache key, so opening a
 * game's detail right after loading the list costs no extra Steam call.
 *
 * A private profile answers 403. That degrades to an empty list rather than
 * failing, because the game itself is still worth showing.
 */
export function loadPlayerAchievements(auth: SteamAuth, appId: number): Promise<SteamPlayerAchievement[]> {
  return withSteamCache<SteamPlayerAchievement[]>(
    `steamAch:${auth.steamid}:${appId}`,
    TTL.achievements,
    async () => {
      try {
        const data = (await getPlayerAchievements(auth.steamid, auth.apiKey, appId)) as SteamPlayerAchievementsResponse
        return data?.playerstats?.success ? (data.playerstats.achievements ?? []) : []
      } catch (err) {
        if ((err as { status?: number }).status === 403) return []
        throw err
      }
    },
    { userId: auth.id },
  )
}

/** Runs `worker` over `items` with at most `limit` in flight. Order is preserved. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

/**
 * Fills achievement counts for at most `budget` games — only ones that have
 * stats and have actually been played, since those are the only ones where a
 * count means anything. Everything else is returned untouched with
 * achievementsLoaded=false.
 *
 * One failing game (a 429, a timeout) leaves that game unloaded instead of
 * failing the whole list.
 */
export async function enrichWithAchievementCounts(
  games: SteamGameProgress[],
  auth: SteamAuth,
  budget: number,
): Promise<SteamGameProgress[]> {
  const eligible = new Set(
    games
      .filter((g) => g.hasStats && g.playtimeForever > 0)
      .slice(0, budget)
      .map((g) => g.id),
  )

  return mapWithConcurrency(games, CONCURRENCY, async (game) => {
    if (!eligible.has(game.id)) return game
    try {
      return withPlayerAchievementCounts(game, await loadPlayerAchievements(auth, game.id))
    } catch (err) {
      console.error('[steamProgress] enrich', game.id, err)
      return game
    }
  })
}
