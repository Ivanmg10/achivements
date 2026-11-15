import pool from '@/lib/db'
import { MIN_REFRESH_AGE_MS, wantsFresh } from '@/lib/wantsFresh'

/**
 * DB-backed cache for Steam Web API responses.
 *
 * raCache keeps RA data in process memory, which is fine because RA is
 * tolerant of repeat calls. Steam is not: the budget is roughly 100-200 calls
 * per 5 minutes for the whole app, so a cache that empties on every cold start
 * or is duplicated per server instance would burn it. This one lives in
 * Postgres and is shared.
 *
 * Keys carry their own namespace ('owned:7', 'schema:730'), so per-user and
 * global entries share one table without a composite key.
 */

/** TTLs tuned to how fast each endpoint's data actually changes. */
export const TTL = {
  profile: 15 * 60 * 1000,
  ownedGames: 60 * 60 * 1000,
  recentlyPlayed: 5 * 60 * 1000,
  /**
   * A year of unlocks, for the streak. Long because a cold scan costs one call
   * per game played in the year; short enough that today's unlock shows up
   * while the day it belongs to is still today.
   */
  unlockYear: 30 * 60 * 1000,
  achievements: 60 * 60 * 1000,
  /** Achievement definitions change only when a developer ships an update. */
  schema: 24 * 60 * 60 * 1000,
  /**
   * Unlock counts keyed by the game's minutes played. Progress can only move
   * when the game is played, which changes the key — so an entry for a game
   * not touched since is still right a month later.
   */
  settledProgress: 30 * 24 * 60 * 60 * 1000,
} as const

export type SteamCacheEvent = 'hit' | 'miss' | 'inflight' | 'stale'
type CacheOutcome<T> = { data: T; stale: boolean; reason?: unknown }

/** Dedupes concurrent misses within one process before they reach Steam. */
const inFlight = new Map<string, Promise<CacheOutcome<unknown>>>()
const staleRetryAfter = new Map<string, { until: number; reason: unknown }>()
const STALE_RETRY_MS = 60 * 1000

function cacheLogKey(key: string): string {
  return key.startsWith('xbox:') ? key.split(':').slice(0, 3).join(':') : key
}

/** `maxAgeMs` turns an entry older than that into a miss — what the refresh button asks for. */
export async function readCache<T>(key: string, maxAgeMs?: number): Promise<T | null> {
  try {
    const result = await pool.query(
      maxAgeMs === undefined
        ? 'SELECT cache_data FROM steam_cache WHERE cache_key = $1 AND expires_at > NOW()'
        : `SELECT cache_data FROM steam_cache WHERE cache_key = $1 AND expires_at > NOW()
             AND created_at > NOW() - ($2 || ' milliseconds')::interval`,
      maxAgeMs === undefined ? [key] : [key, String(maxAgeMs)],
    )
    return result.rows[0] ? (result.rows[0].cache_data as T) : null
  } catch (err) {
    // A cache read failing must not take the request down with it.
    console.error('[steamCache] read', cacheLogKey(key), err)
    return null
  }
}

/** An entry younger than `maxAgeMs`, live or expired, with how old it is: what serving stale data (#177) reads. */
export async function readCacheEntry<T>(key: string, maxAgeMs: number): Promise<{ data: T; ageMs: number; live: boolean } | null> {
  try {
    const { rows } = await pool.query(
      `SELECT cache_data, expires_at > NOW() AS live, EXTRACT(EPOCH FROM (NOW() - created_at)) * 1000 AS age_ms
         FROM steam_cache WHERE cache_key = $1 AND created_at > NOW() - ($2 || ' milliseconds')::interval`,
      [key, String(maxAgeMs)],
    )
    const row = rows[0]
    return row ? { data: row.cache_data as T, ageMs: Number(row.age_ms), live: row.live === true } : null
  } catch (err) {
    console.error('[steamCache] read entry', cacheLogKey(key), err)
    return null
  }
}

/**
 * A lease on `key` for `ms`: true when this caller holds it. A row that expires, not a session lock, so it holds
 * no connection while the work runs and a crashed holder lets go on its own. A database that will not answer
 * grants it (the work runs, as it would have without a lease).
 */
export async function takeLease(key: string, ms: number): Promise<boolean> {
  try {
    const { rowCount } = await pool.query(
      `INSERT INTO steam_cache (cache_key, cache_data, expires_at) VALUES ($1, 'true', NOW() + ($2 || ' milliseconds')::interval)
       ON CONFLICT (cache_key) DO UPDATE SET expires_at = EXCLUDED.expires_at, created_at = NOW()
         WHERE steam_cache.expires_at <= NOW()`,
      [key, String(ms)],
    )
    return rowCount === 1
  } catch (err) {
    console.error('[steamCache] lease', cacheLogKey(key), err)
    return true
  }
}

export async function dropLease(key: string): Promise<void> {
  await pool.query('DELETE FROM steam_cache WHERE cache_key = $1', [key]).catch((err: unknown) => console.error('[steamCache] drop lease', cacheLogKey(key), err))
}

/** The last successful value, even expired. Only used after an allowed upstream failure. */
async function readStaleCache<T>(key: string): Promise<T | null> {
  try {
    const result = await pool.query('SELECT cache_data FROM steam_cache WHERE cache_key = $1', [key])
    return result.rows[0] ? (result.rows[0].cache_data as T) : null
  } catch (err) {
    console.error('[steamCache] read stale', cacheLogKey(key), err)
    return null
  }
}

/**
 * Live entries for many keys in one query — for enriching a whole library
 * without one round trip per game. Missing and expired keys are absent from
 * the map; a DB failure degrades to an empty map (all misses).
 */
export async function readCacheMany<T>(keys: string[]): Promise<Map<string, T>> {
  const found = new Map<string, T>()
  if (keys.length === 0) return found
  try {
    const result = await pool.query(
      'SELECT cache_key, cache_data FROM steam_cache WHERE cache_key = ANY($1) AND expires_at > NOW()',
      [keys],
    )
    for (const row of result.rows) found.set(row.cache_key, row.cache_data as T)
  } catch (err) {
    console.error('[steamCache] readMany', keys.length, err)
  }
  return found
}

export async function writeCache(
  key: string,
  data: unknown,
  ttlMs: number,
  userId: string | null = null,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO steam_cache (cache_key, user_id, cache_data, expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 || ' milliseconds')::interval)
       ON CONFLICT (cache_key) DO UPDATE
         SET cache_data = EXCLUDED.cache_data,
             expires_at = EXCLUDED.expires_at,
             user_id    = EXCLUDED.user_id,
             created_at = NOW()`,
      [key, userId, JSON.stringify(data), String(ttlMs)],
    )
  } catch (err) {
    console.error('[steamCache] write', cacheLogKey(key), err)
  }
}

/**
 * Returns the cached value, or fetches, stores and returns a fresh one.
 * `shouldCache` rejects error-shaped payloads (a private profile, say) so they
 * are not stored for an hour. `refreshable` lets the refresh button replace an
 * entry older than MIN_REFRESH_AGE_MS: only for cheap, top-level keys, never
 * the per-game ones a whole library is built from.
 */
export async function withSteamCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options: {
    userId?: string | null
    shouldCache?: (data: T) => boolean
    refreshable?: boolean
    staleIfError?: (err: unknown) => boolean
    staleResult?: () => boolean
    onEvent?: (event: SteamCacheEvent) => void
  } = {},
): Promise<T> {
  const maxAge = options.refreshable && (await wantsFresh()) ? MIN_REFRESH_AGE_MS : undefined
  const hit = await readCache<T>(key, maxAge)
  if (hit !== null) {
    staleRetryAfter.delete(key)
    options.onEvent?.('hit')
    return hit
  }

  const existing = inFlight.get(key)
  if (existing) {
    options.onEvent?.('inflight')
    const outcome = (await existing) as CacheOutcome<T>
    if (outcome.stale && outcome.reason && !options.staleIfError?.(outcome.reason)) throw outcome.reason
    if (outcome.stale) options.onEvent?.('stale')
    return outcome.data
  }

  options.onEvent?.('miss')
  const retry = staleRetryAfter.get(key)
  if (options.staleIfError && retry && retry.until > Date.now()) {
    if (!options.staleIfError(retry.reason)) throw retry.reason
    const stale = await readStaleCache<T>(key)
    if (stale !== null) {
      options.onEvent?.('stale')
      return stale
    }
  }

  const promise = (async (): Promise<CacheOutcome<T>> => {
    try {
      const data = await fetcher()
      const stale = options.staleResult?.() ?? false
      if (!stale && (!options.shouldCache || options.shouldCache(data))) {
        await writeCache(key, data, ttlMs, options.userId ?? null)
      }
      staleRetryAfter.delete(key)
      return { data, stale }
    } catch (err) {
      if (!options.staleIfError?.(err)) throw err
      const stale = await readStaleCache<T>(key)
      if (stale === null) throw err
      staleRetryAfter.set(key, { until: Date.now() + STALE_RETRY_MS, reason: err })
      return { data: stale, stale: true, reason: err }
    }
  })()
    .finally(() => inFlight.delete(key))

  inFlight.set(key, promise as Promise<CacheOutcome<unknown>>)
  const outcome = await promise
  if (outcome.stale) options.onEvent?.('stale')
  return outcome.data
}

/** Drops every cached row for a user — used when they unlink Steam. */
export async function clearUserCache(userId: string): Promise<void> {
  try {
    await pool.query('DELETE FROM steam_cache WHERE user_id = $1', [userId])
    // RA's rows carry no user_id: their key does ("ra:recentAch_v2:7", "ra:gameProgression_v3:7:123").
    await pool.query("DELETE FROM steam_cache WHERE cache_key ~ ('^ra:[^:]+:' || $1 || '(:|$)')", [userId])
  } catch (err) {
    console.error('[steamCache] clearUserCache', userId, err)
  }
}

/**
 * Deletes expired rows; run daily by /api/cron/sweepCache. Xbox rows stay for
 * 30 days so stale-if-error still has a last good value, PSN's 7 (served stale, #177). Throws on failure.
 */
export async function sweepExpired(): Promise<number> {
  const result = await pool.query(`DELETE FROM steam_cache
    WHERE expires_at <= NOW()
      AND (cache_key NOT LIKE 'xbox:%' OR expires_at <= NOW() - INTERVAL '30 days')
      AND (cache_key NOT LIKE 'psn:%' OR expires_at <= NOW() - INTERVAL '7 days')`)
  return result.rowCount ?? 0
}
