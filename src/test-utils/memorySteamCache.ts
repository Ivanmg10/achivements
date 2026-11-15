/**
 * An in-memory stand-in for `@/lib/steamCache`, for tests that count calls to a
 * platform. It keeps what the real one decides: an entry lives until its TTL
 * (by `Date.now()`, so a test can move the clock), and a miss that is already
 * being fetched is shared, not fetched twice.
 */
type Entry = { data: unknown; expiresAt: number }

const entries = new Map<string, Entry>()
const inFlight = new Map<string, Promise<unknown>>()

const live = (key: string) => {
  const entry = entries.get(key)
  return entry && entry.expiresAt > Date.now() ? entry : null
}

export const memorySteamCache = {
  async readCacheMany<T>(keys: string[]): Promise<Map<string, T>> {
    return new Map(keys.flatMap((key) => (live(key) ? [[key, live(key)!.data as T] as const] : [])))
  },
  async writeCache(key: string, data: unknown, ttlMs: number): Promise<void> {
    entries.set(key, { data: JSON.parse(JSON.stringify(data)), expiresAt: Date.now() + ttlMs })
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
