/**
 * An in-memory stand-in for `@/lib/steamCache`, for tests that count calls to a
 * platform. It keeps what the real one decides: an entry lives until its TTL
 * (by `Date.now()`, so a test can move the clock), an expired one is still
 * there for whoever reads it stale (`readCacheEntry`), a miss that is already
 * being fetched is shared, not fetched twice, and a lease is a live entry.
 */
type Entry = { data: unknown; expiresAt: number; createdAt: number }

const entries = new Map<string, Entry>()
const inFlight = new Map<string, Promise<unknown>>()

const live = (key: string) => {
  const entry = entries.get(key)
  return entry && entry.expiresAt > Date.now() ? entry : null
}

export const memorySteamCache = {
  async readCache<T>(key: string): Promise<T | null> {
    return (live(key)?.data as T) ?? null
  },
  async readCacheEntry<T>(key: string, maxAgeMs: number): Promise<{ data: T; ageMs: number; live: boolean } | null> {
    const entry = entries.get(key)
    const ageMs = entry ? Date.now() - entry.createdAt : 0
    return entry && ageMs < maxAgeMs ? { data: entry.data as T, ageMs, live: entry.expiresAt > Date.now() } : null
  },
  async readCacheMany<T>(keys: string[]): Promise<Map<string, T>> {
    return new Map(keys.flatMap((key) => (live(key) ? [[key, live(key)!.data as T] as const] : [])))
  },
  async writeCache(key: string, data: unknown, ttlMs: number): Promise<void> {
    entries.set(key, { data: JSON.parse(JSON.stringify(data)), expiresAt: Date.now() + ttlMs, createdAt: Date.now() })
  },
  async takeLease(key: string, ms: number): Promise<boolean> {
    if (live(key)) return false
    await memorySteamCache.writeCache(key, true, ms)
    return true
  },
  async dropLease(key: string): Promise<void> {
    entries.delete(key)
  },
  async withSteamCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const hit = live(key)
    if (hit) return hit.data as T
    const pending = inFlight.get(key)
    if (pending) return pending as Promise<T>
    const fetching = fetcher()
      .then(async (data) => {
        await memorySteamCache.writeCache(key, data, ttlMs)
        return data
      })
      .finally(() => inFlight.delete(key))
    inFlight.set(key, fetching)
    return fetching
  },
  clear(): void {
    entries.clear()
    inFlight.clear()
  },
}
