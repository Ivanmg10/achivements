import { withSteamCache, readCacheMany, writeCache, TTL } from '@/lib/steamCache'
import { getOwnedGames, getPlayerAchievements, getSchemaForGame } from '@/lib/steamClient'
import { withPlayerAchievementCounts } from '@/utils/steamMappers'
import type {
  SteamGameProgress,
  SteamOwnedGamesResponse,
  SteamPlayerAchievement,
  SteamPlayerAchievementsResponse,
  SteamSchemaAchievement,
  SteamSchemaResponse,
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
 * Steam's answer for a game that has no achievements, even when the owned list
 * flagged it as having stats (seen live: The Lab, "Requested app has no
 * stats", every time). Unlike an empty list, it is definitive.
 */
export const NO_STATS = { noStats: true } as const
export type PlayerUnlocks = SteamPlayerAchievement[] | typeof NO_STATS

export function isNoStats(unlocks: PlayerUnlocks): unlocks is typeof NO_STATS {
  return !Array.isArray(unlocks) && unlocks?.noStats === true
}

/**
 * One game's unlocks straight from Steam.
 *
 * - 403 (private profile): an empty list — progress unknown, but the game is
 *   still worth showing.
 * - 400 (the app has no stats): NO_STATS — the game has no achievements.
 *   Treating it as a transient failure would retry it forever and keep the
 *   library from ever counting as complete.
 */
export async function fetchPlayerAchievements(auth: SteamAuth, appId: number): Promise<PlayerUnlocks> {
  try {
    const data = (await getPlayerAchievements(auth.steamid, auth.apiKey, appId)) as SteamPlayerAchievementsResponse
    return data?.playerstats?.success ? (data.playerstats.achievements ?? []) : []
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 403) return []
    if (status === 400) return NO_STATS
    throw err
  }
}

/** Applies unlocks to a game: counts, or "has no achievements" for NO_STATS. */
export function applyUnlocks(game: SteamGameProgress, unlocks: PlayerUnlocks): SteamGameProgress {
  if (isNoStats(unlocks)) return { ...game, hasStats: false }
  return withPlayerAchievementCounts(game, unlocks)
}

/** The unlock list for one game's detail view, cached per player for an hour. */
export function loadPlayerAchievements(auth: SteamAuth, appId: number): Promise<SteamPlayerAchievement[]> {
  return withSteamCache<SteamPlayerAchievement[]>(
    `steamAch:${auth.steamid}:${appId}`,
    TTL.achievements,
    async () => {
      const unlocks = await fetchPlayerAchievements(auth, appId)
      return isNoStats(unlocks) ? [] : unlocks
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
  const cached = await readCacheMany<PlayerUnlocks>([...keyOf.values()])

  const misses = countable.filter((g) => !cached.has(keyOf.get(g.id)!))
  const toFetch = new Set(misses.slice(0, maxFetches).map((g) => g.id))
  let complete = misses.length <= maxFetches

  const enriched = await mapWithConcurrency(games, CONCURRENCY, async (game) => {
    const key = keyOf.get(game.id)
    if (!key) return game

    const hit = cached.get(key)
    if (hit) return applyUnlocks(game, hit)
    if (!toFetch.has(game.id)) return game

    try {
      const unlocks = await fetchPlayerAchievements(auth, game.id)
      // An empty list (private profile) is cached briefly rather than skipped,
      // or every page load would re-fetch it — but not for a month either, so
      // making the profile public takes effect. NO_STATS is final.
      const unknown = Array.isArray(unlocks) && unlocks.length === 0
      await writeCache(key, unlocks, unknown ? TTL.achievements : progressTtl(game), auth.id)
      return applyUnlocks(game, unlocks)
    } catch (err) {
      console.error('[steamProgress] enrich', game.id, err)
      complete = false
      return game
    }
  })

  return { games: enriched, complete }
}

/** What the owned list knows about a game that the recent list leaves out. */
export type OwnedFacts = { rtime_last_played?: number; has_community_visible_stats?: boolean }

/**
 * appid → facts only GetOwnedGames returns.
 *
 * GetRecentlyPlayedGames (checked against the live API) returns neither
 * rtime_last_played nor has_community_visible_stats, and does not order its
 * games by date. Without the date, recent Steam games sort after every dated
 * RA game in the merged feed and never make the cut; without the stats flag,
 * every recent game looks achievement-less — no counts, no bar, and nothing
 * to load when a card is opened.
 *
 * Never throws: if the lookup fails the games are still worth showing.
 */
export async function loadOwnedFacts(auth: SteamAuth): Promise<Map<number, OwnedFacts>> {
  try {
    const data = (await getOwnedGames(auth.steamid, auth.apiKey)) as SteamOwnedGamesResponse
    const facts = new Map<number, OwnedFacts>()
    for (const g of data?.response?.games ?? []) {
      facts.set(g.appid, {
        rtime_last_played: g.rtime_last_played || undefined,
        has_community_visible_stats: g.has_community_visible_stats,
      })
    }
    return facts
  } catch (err) {
    console.error('[steamProgress] owned facts', err)
    return new Map()
  }
}

/**
 * A game's achievement definitions (names, descriptions, badges) in one
 * language, cached for everyone for a day. Shared by the achievements route
 * and the recent-unlocks list so each schema is downloaded once.
 */
export function loadSchema(appId: number, apiKey: string, lang: string): Promise<SteamSchemaAchievement[]> {
  return withSteamCache<SteamSchemaAchievement[]>(`steamSchema:${appId}:${lang}`, TTL.schema, async () => {
    const data = (await getSchemaForGame(appId, apiKey, lang)) as SteamSchemaResponse
    return data?.game?.availableGameStats?.achievements ?? []
  })
}
