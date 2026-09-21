import { withSteamCache, readCacheMany, writeCache, TTL } from '@/lib/steamCache'
import { getOwnedGames, getPlayerAchievements } from '@/lib/steamClient'
import { withPlayerAchievementCounts } from '@/utils/steamMappers'
import type {
  SteamGameProgress,
  SteamOwnedGamesResponse,
  SteamPlayerAchievement,
  SteamPlayerAchievementsResponse,
} from '@/types/steam'

/** Parallel Steam calls per enrichment — keeps a burst well under the rate limit. */
const CONCURRENCY = 4

/**
 * A game played this recently may still be mid-session, unlocking achievements
 * without its last-played time having moved yet — so its counts get the short
 * TTL instead of the settled one.
 */
const ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000

export type SteamAuth = { id: string; steamid: string; apiKey: string }

/**
 * One game's unlock list straight from Steam. A private profile answers 403;
 * that degrades to an empty list, because the game is still worth showing.
 */
export async function fetchPlayerAchievements(auth: SteamAuth, appId: number): Promise<SteamPlayerAchievement[]> {
  try {
    const data = (await getPlayerAchievements(auth.steamid, auth.apiKey, appId)) as SteamPlayerAchievementsResponse
    return data?.playerstats?.success ? (data.playerstats.achievements ?? []) : []
  } catch (err) {
    if ((err as { status?: number }).status === 403) return []
    throw err
  }
}

/** The unlock list for one game's detail view, cached per player for an hour. */
export function loadPlayerAchievements(auth: SteamAuth, appId: number): Promise<SteamPlayerAchievement[]> {
  return withSteamCache<SteamPlayerAchievement[]>(
    `steamAch:${auth.steamid}:${appId}`,
    TTL.achievements,
    () => fetchPlayerAchievements(auth, appId),
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
 * Cache key for a game's unlock counts, including when it was last played.
 * Progress can only change by playing, and playing changes this key — so a
 * hit is correct however old it is, and a game played since is a miss.
 */
export function progressCacheKey(steamid: string, game: SteamGameProgress): string {
  const played = game.lastPlayed ? Date.parse(game.lastPlayed) : 0
  return `steamProgress:${steamid}:${game.id}:${played}`
}

export function progressTtl(game: SteamGameProgress, now = Date.now()): number {
  const played = game.lastPlayed ? Date.parse(game.lastPlayed) : 0
  return now - played < ACTIVE_WINDOW_MS ? TTL.achievements : TTL.settledProgress
}

/** Only played games with achievements have counts worth fetching. */
export function isCountable(game: SteamGameProgress): boolean {
  return game.hasStats && game.playtimeForever > 0
}

/**
 * Fills achievement counts for every countable game. Cached counts come back
 * in one DB query; at most `maxFetches` misses go to Steam per call, in the
 * order given (so pass games newest first).
 *
 * `complete` is false when misses were left for a later call, or a fetch
 * failed — callers should not cache an incomplete result, so the next call
 * carries on from where this one stopped.
 *
 * One failing game (a 429, a timeout) leaves that game unloaded instead of
 * failing the list.
 */
export async function enrichWithAchievementCounts(
  games: SteamGameProgress[],
  auth: SteamAuth,
  maxFetches: number,
): Promise<{ games: SteamGameProgress[]; complete: boolean }> {
  const countable = games.filter(isCountable)
  const keyOf = new Map(countable.map((g) => [g.id, progressCacheKey(auth.steamid, g)]))
  const cached = await readCacheMany<SteamPlayerAchievement[]>([...keyOf.values()])

  const misses = countable.filter((g) => !cached.has(keyOf.get(g.id)!))
  const toFetch = new Set(misses.slice(0, maxFetches).map((g) => g.id))
  let complete = misses.length <= maxFetches

  const enriched = await mapWithConcurrency(games, CONCURRENCY, async (game) => {
    const key = keyOf.get(game.id)
    if (!key) return game

    const hit = cached.get(key)
    if (hit) return withPlayerAchievementCounts(game, hit)
    if (!toFetch.has(game.id)) return game

    try {
      const list = await fetchPlayerAchievements(auth, game.id)
      // An empty list (private profile) is cached briefly rather than skipped,
      // or every page load would re-fetch it — but not for a month either, so
      // making the profile public takes effect.
      await writeCache(key, list, list.length > 0 ? progressTtl(game) : TTL.achievements, auth.id)
      return withPlayerAchievementCounts(game, list)
    } catch (err) {
      console.error('[steamProgress] enrich', game.id, err)
      complete = false
      return game
    }
  })

  return { games: enriched, complete }
}

/**
 * appid → last-played time (unix seconds), from the owned-games list.
 *
 * GetRecentlyPlayedGames does not return rtime_last_played — only
 * GetOwnedGames does — and it does not order its games by date either. Without
 * this, recent Steam games have no date, sort after every dated RA game in the
 * merged feed, and never make the cut.
 *
 * Never throws: if the lookup fails the games are still worth showing undated.
 */
export async function loadLastPlayedDates(auth: SteamAuth): Promise<Map<number, number>> {
  try {
    const data = (await getOwnedGames(auth.steamid, auth.apiKey)) as SteamOwnedGamesResponse
    const dates = new Map<number, number>()
    for (const g of data?.response?.games ?? []) {
      if (g.rtime_last_played) dates.set(g.appid, g.rtime_last_played)
    }
    return dates
  } catch (err) {
    console.error('[steamProgress] last played dates', err)
    return new Map()
  }
}
