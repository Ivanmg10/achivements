import pool from '@/lib/db'

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
  achievements: 60 * 60 * 1000,
  /** Achievement definitions change only when a developer ships an update. */
  schema: 24 * 60 * 60 * 1000,
  /**
   * Unlock counts keyed by the game's last-played time. Progress can only move
   * when the game is played, which changes the key — so an entry for a game
   * not touched since is still right a month later.
   */
  settledProgress: 30 * 24 * 60 * 60 * 1000,
} as const

/** Dedupes concurrent misses within one process before they reach Steam. */
const inFlight = new Map<string, Promise<unknown>>()

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const result = await pool.query(
      'SELECT cache_data FROM steam_cache WHERE cache_key = $1 AND expires_at > NOW()',
      [key],
    )
    return result.rows[0] ? (result.rows[0].cache_data as T) : null
  } catch (err) {
    // A cache read failing must not take the request down with it.
    console.error('[steamCache] read', key, err)
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
             user_id    = EXCLUDED.user_id`,
      [key, userId, JSON.stringify(data), String(ttlMs)],
    )
  } catch (err) {
    console.error('[steamCache] write', key, err)
  }
}

/**
 * Returns the cached value, or fetches, stores and returns a fresh one.
 * `shouldCache` rejects error-shaped payloads (a private profile, say) so they
 * are not stored for an hour.
 */
export async function withSteamCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options: { userId?: string | null; shouldCache?: (data: T) => boolean } = {},
): Promise<T> {
  const hit = await readCache<T>(key)
  if (hit !== null) return hit

  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>

  const promise = (async () => {
    const data = await fetcher()
    if (!options.shouldCache || options.shouldCache(data)) {
      await writeCache(key, data, ttlMs, options.userId ?? null)
    }
    return data
  })()
    .finally(() => inFlight.delete(key))

  inFlight.set(key, promise as Promise<unknown>)
  return promise
}

/** Drops every cached row for a user — used when they unlink Steam. */
export async function clearUserCache(userId: string): Promise<void> {
  try {
    await pool.query('DELETE FROM steam_cache WHERE user_id = $1', [userId])
  } catch (err) {
    console.error('[steamCache] clearUserCache', userId, err)
  }
}

/** Deletes expired rows. Nothing depends on this running — reads filter on expiry. */
export async function sweepExpired(): Promise<number> {
  try {
    const result = await pool.query('DELETE FROM steam_cache WHERE expires_at <= NOW()')
    return result.rowCount ?? 0
  } catch (err) {
    console.error('[steamCache] sweepExpired', err)
    return 0
  }
}
