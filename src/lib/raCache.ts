import { readCache, writeCache } from './steamCache'
import { MIN_REFRESH_AGE_MS, wantsFresh } from './wantsFresh'

type Entry = { data: unknown; expiresAt: number; storedAt: number }

const store = new Map<string, Entry>()
const inFlight = new Map<string, Promise<unknown>>()

export const MAX_CACHE_ENTRIES = 5000
const SWEEP_INTERVAL_MS = 10 * 60 * 1000
const MEMORY_REUSE_MS = 60 * 1000
const DB_PREFIX = 'ra:'
// Development clears memory on purpose (a route's transform may have changed);
// the shared table would hand back the old shape, so it is skipped there.
const USE_DB = process.env.NODE_ENV !== 'development'

if (process.env.NODE_ENV === 'development') {
  store.clear()
}

function sweepExpired(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key)
  }
}

function enforceCap(): void {
  if (store.size <= MAX_CACHE_ENTRIES) return
  sweepExpired()
  // Still over the cap after sweeping expired entries (all remaining entries
  // are live) — drop the oldest ones until back under it.
  while (store.size > MAX_CACHE_ENTRIES) {
    const oldestKey = store.keys().next().value
    if (oldestKey === undefined) break
    store.delete(oldestKey)
  }
}

// Periodic sweep so a long-lived process doesn't accumulate expired entries
// indefinitely between requests. unref() so this timer never keeps the
// process (or a short-lived script/test run) alive on its own.
if (typeof setInterval !== 'undefined') {
  const sweepTimer = setInterval(sweepExpired, SWEEP_INTERVAL_MS)
  sweepTimer.unref?.()
}

/**
 * `shouldCache` is a validity check, and failing it throws RA_VALIDATION_FAILED
 * — which every caller turns into a 503. So it must only ask whether the
 * response has the SHAPE it should, never whether it has anything in it: an
 * empty list is a real answer (no achievements in the window, a game with no
 * subsets, a user who has finished nothing) and answering 503 to it told the
 * UI that RA was down and kept it retrying forever.
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  shouldCache?: (data: T) => boolean,
  options: { refreshable?: boolean } = {},
): Promise<T> {
  // The refresh button may replace an entry older than MIN_REFRESH_AGE_MS; see wantsFresh.
  const maxAge = options.refreshable && (await wantsFresh()) ? MIN_REFRESH_AGE_MS : undefined
  const hit = store.get(key)
  if (hit && Date.now() < hit.expiresAt && (maxAge === undefined || Date.now() - hit.storedAt < maxAge)) {
    return hit.data as T
  }

  // Stampede prevention: reuse in-flight promise for concurrent requests
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>

  const promise = (async () => {
    // Second level: Postgres, shared by every instance and surviving cold starts.
    if (USE_DB) {
      const shared = await readCache<T>(DB_PREFIX + key, maxAge)
      if (shared !== null) {
        // ponytail: the row's remaining life is unknown here, so memory holds it
        // briefly (worst case it lives MEMORY_REUSE_MS past expiry); read it if that matters.
        store.set(key, { data: shared, expiresAt: Date.now() + Math.min(ttlMs, MEMORY_REUSE_MS), storedAt: Date.now() })
        enforceCap()
        return shared
      }
    }
    const data = await fetcher()
    if (shouldCache && !shouldCache(data)) {
      throw Object.assign(new Error('RA_VALIDATION_FAILED'), { code: 'RA_VALIDATION_FAILED' })
    }
    store.set(key, { data, expiresAt: Date.now() + ttlMs, storedAt: Date.now() })
    enforceCap()
    if (USE_DB) await writeCache(DB_PREFIX + key, data, ttlMs)
    return data
  })().finally(() => inFlight.delete(key))

  inFlight.set(key, promise as Promise<unknown>)
  return promise
}

export function clearCache(): void {
  store.clear()
  inFlight.clear()
}
