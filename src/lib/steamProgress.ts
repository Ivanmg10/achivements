import { withSteamCache, readCacheMany, writeCache, TTL } from '@/lib/steamCache'
import { recordUnlocks } from '@/lib/steamUnlocks'
import { getGlobalAchievementPercentages, getOwnedGames, getPlayerAchievements, getSchemaForGame, getTopAchievementsForGames } from '@/lib/steamClient'
import { countUnlocks, toGlobalPctMap, withUnlockCounts } from '@/utils/steamMappers'
import type {
  SteamGameProgress,
  SteamGlobalPercentagesResponse,
  SteamOwnedGamesResponse,
  SteamPlayerAchievement,
  SteamPlayerAchievementsResponse,
  SteamSchemaAchievement,
  SteamSchemaResponse,
  SteamTopAchievementsResponse,
  SteamUnlockCounts,
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

/** A profile Steam will not show the games of: private, friends-only, or public with game details private. */
export class SteamPrivateError extends Error {
  constructor() {
    super('The Steam profile is not public')
  }
}

/**
 * Such a profile's owned list reads `{ response: {} }`, not an error (measured
 * 2026-10-16); a public account with no games still carries `game_count`.
 * ponytail: a public account with no games and no game_count would read as private; unverified.
 */
export function isPrivateLibrary(data: SteamOwnedGamesResponse | null | undefined): boolean {
  return !data?.response?.games && typeof data?.response?.game_count !== 'number'
}

/**
 * Steam's owned list as it comes, shared by every read built from it (the
 * library, recently played, recent unlocks, activity, the year's unlocks): a
 * home page asked Steam for the same list up to five times. Five minutes, as
 * fresh as "recently played" needs. A private answer (no games, no
 * game_count) is not cached, so making the profile public shows at once.
 */
export function loadOwnedGames(auth: SteamAuth): Promise<SteamOwnedGamesResponse> {
  return withSteamCache<SteamOwnedGamesResponse>(
    `steamOwnedRaw:${auth.steamid}`,
    TTL.recentlyPlayed,
    async () => (await getOwnedGames(auth.steamid, auth.apiKey)) as SteamOwnedGamesResponse,
    {
      userId: auth.id,
      shouldCache: (d) => !isPrivateLibrary(d),
      refreshable: true,
    },
  )
}

/**
 * Steam's answer for a game that has no achievements, even when the owned list
 * flagged it as having stats (seen live: The Lab, "Requested app has no
 * stats", every time). Unlike an empty list, it is definitive.
 */
export const NO_STATS = { noStats: true } as const
export type PlayerUnlocks = SteamPlayerAchievement[] | typeof NO_STATS

/**
 * What the library cache keeps per game: the counts, not Steam's whole list —
 * a list is ~2 KB a row and only its two numbers were ever read. Lists still
 * come back from rows written before this; they are counted on read until
 * they expire.
 */
export type CachedUnlocks = SteamUnlockCounts | typeof NO_STATS | SteamPlayerAchievement[]

export function isNoStats(unlocks: CachedUnlocks): unlocks is typeof NO_STATS {
  return !Array.isArray(unlocks) && 'noStats' in Object(unlocks)
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
    const list = data?.playerstats?.success ? (data.playerstats.achievements ?? []) : []
    // Every read keeps its dated unlocks: the streak counts games not read on its own page load.
    await recordUnlocks(auth.id, auth.steamid, appId, list)
    return list
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 403) return []
    if (status === 400) return NO_STATS
    throw err
  }
}

/** Applies unlocks to a game: counts, or "has no achievements" for NO_STATS. */
export function applyUnlocks(game: SteamGameProgress, unlocks: CachedUnlocks): SteamGameProgress {
  if (isNoStats(unlocks)) return { ...game, hasStats: false }
  return withUnlockCounts(game, Array.isArray(unlocks) ? countUnlocks(unlocks) : unlocks)
}

export function toCachedUnlocks(unlocks: PlayerUnlocks): CachedUnlocks {
  return isNoStats(unlocks) ? unlocks : countUnlocks(unlocks)
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
  return `steamProgress2:${steamid}:${game.id}:${played}`
}

export function progressTtl(game: SteamGameProgress, now = Date.now()): number {
  const played = game.lastPlayed ? Date.parse(game.lastPlayed) : 0
  return now - played < ACTIVE_WINDOW_MS ? TTL.achievements : TTL.settledProgress
}

/** Only played games with achievements have counts worth fetching. */
export function isCountable(game: SteamGameProgress): boolean {
  return game.hasStats && game.playtimeForever > 0
}

/** Games per batched count call (192 in one went fine, measured 2026-10-22). */
const BATCH_SIZE = 100

type BatchCounts = Map<number, { total: number; awarded: number }>

/** Counts for many games, BATCH_SIZE a call. Null when Steam fails: the per-game path takes over. */
export async function fetchBatchCounts(auth: SteamAuth, appIds: number[]): Promise<BatchCounts | null> {
  try {
    const counts: BatchCounts = new Map()
    for (let i = 0; i < appIds.length; i += BATCH_SIZE) {
      const data = (await getTopAchievementsForGames(
        auth.steamid,
        auth.apiKey,
        appIds.slice(i, i + BATCH_SIZE),
      )) as SteamTopAchievementsResponse
      for (const g of data?.response?.games ?? []) {
        counts.set(g.appid, { total: g.total_achievements ?? 0, awarded: g.achievements?.length ?? 0 })
      }
    }
    return counts
  } catch (err) {
    console.error('[steamProgress] batch counts', err)
    return null
  }
}

/**
 * Batched counts for the misses, trusted only when Steam's own per-game call
 * agrees the achievements are public. The batch answers even for a profile
 * whose achievements Steam keeps private (measured 2026-10-22: "Profile is not
 * public" per game, the unlocks in the batch); that choice is the user's, so
 * one game with unlocks is read on its own first, and an empty answer drops
 * the batch. That probe's list is kept, so it costs nothing extra.
 */
async function batchCountsFor(
  auth: SteamAuth,
  misses: SteamGameProgress[],
): Promise<{ counts: BatchCounts | null; probe: { appId: number; unlocks: PlayerUnlocks } | null }> {
  if (misses.length === 0) return { counts: null, probe: null }
  const counts = await fetchBatchCounts(auth, misses.map((g) => g.id))
  const probeGame = counts && misses.find((g) => (counts.get(g.id)?.awarded ?? 0) > 0)
  if (!counts || !probeGame) return { counts, probe: null }
  try {
    const unlocks = await fetchPlayerAchievements(auth, probeGame.id)
    const isPrivate = Array.isArray(unlocks) && unlocks.length === 0
    return { counts: isPrivate ? null : counts, probe: { appId: probeGame.id, unlocks } }
  } catch (err) {
    console.error('[steamProgress] batch probe', probeGame.id, err)
    return { counts: null, probe: null }
  }
}

/**
 * Fills achievement counts for every countable game. Cached counts come back
 * in one DB query; the misses are counted in one batched call (`fetchBatchCounts`),
 * and only finished games (and any the batch missed) go to Steam one by one, at
 * most `maxFetches` per call, in the order given (so pass games newest first).
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
  const cached = await readCacheMany<CachedUnlocks>([...keyOf.values()])

  const misses = countable.filter((g) => !cached.has(keyOf.get(g.id)!))
  const { counts: batch, probe } = await batchCountsFor(auth, misses)
  // A game in progress (or not started) is counted from the batch; a finished
  // one still needs its own call, for the date it was finished (lastUnlock).
  const fromBatch = (g: SteamGameProgress) => {
    const b = batch?.get(g.id)
    return b && b.total > 0 && b.awarded < b.total ? b : null
  }
  const needsFetch = misses.filter((g) => !fromBatch(g) && g.id !== probe?.appId)
  const toFetch = new Set(needsFetch.slice(0, maxFetches).map((g) => g.id))
  let complete = needsFetch.length <= maxFetches

  async function keep(game: SteamGameProgress, key: string, unlocks: PlayerUnlocks) {
    // An empty list (private profile) is cached briefly rather than skipped,
    // or every page load would re-fetch it — but not for a month either, so
    // making the profile public takes effect. NO_STATS is final.
    const unknown = Array.isArray(unlocks) && unlocks.length === 0
    await writeCache(key, toCachedUnlocks(unlocks), unknown ? TTL.achievements : progressTtl(game), auth.id)
    return applyUnlocks(game, unlocks)
  }

  const enriched = await mapWithConcurrency(games, CONCURRENCY, async (game) => {
    const key = keyOf.get(game.id)
    if (!key) return game

    const hit = cached.get(key)
    if (hit) return applyUnlocks(game, hit)
    if (probe && probe.appId === game.id) return keep(game, key, probe.unlocks)
    const counted = fromBatch(game)
    if (counted) {
      const counts: SteamUnlockCounts = { total: counted.total, awarded: counted.awarded, lastUnlock: null }
      await writeCache(key, counts, progressTtl(game), auth.id)
      return withUnlockCounts(game, counts)
    }
    if (!toFetch.has(game.id)) return game

    try {
      return await keep(game, key, await fetchPlayerAchievements(auth, game.id))
    } catch (err) {
      console.error('[steamProgress] enrich', game.id, err)
      complete = false
      return game
    }
  })

  return { games: enriched, complete }
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

/**
 * Each achievement's share of all Steam players (0–100), cached for everyone
 * for a day. Rarity is a nice-to-have: if Steam will not give it, the result
 * is empty and callers render without it.
 */
export async function loadGlobalPct(appId: number): Promise<Map<string, number>> {
  try {
    const data = await withSteamCache<SteamGlobalPercentagesResponse>(
      `steamGlobalPct:${appId}`,
      TTL.schema,
      async () => (await getGlobalAchievementPercentages(appId)) as SteamGlobalPercentagesResponse,
    )
    return toGlobalPctMap(data)
  } catch (err) {
    console.error('[steamProgress] global pct', appId, err)
    return new Map()
  }
}
