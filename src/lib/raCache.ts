type Entry = { data: unknown; expiresAt: number }

const store = new Map<string, Entry>()
const inFlight = new Map<string, Promise<unknown>>()

export const MAX_CACHE_ENTRIES = 5000
const SWEEP_INTERVAL_MS = 10 * 60 * 1000

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

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  shouldCache?: (data: T) => boolean,
): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() < hit.expiresAt) return hit.data as T

  // Stampede prevention: reuse in-flight promise for concurrent requests
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>

  const promise = fetcher()
    .then((data) => {
      if (shouldCache && !shouldCache(data)) {
        inFlight.delete(key)
        throw Object.assign(new Error('RA_VALIDATION_FAILED'), { code: 'RA_VALIDATION_FAILED' })
      }
      store.set(key, { data, expiresAt: Date.now() + ttlMs })
      enforceCap()
      inFlight.delete(key)
      return data
    })
    .catch((err) => {
      inFlight.delete(key)
      throw err
    })

  inFlight.set(key, promise as Promise<unknown>)
  return promise
}

export function clearCache(): void {
  store.clear()
  inFlight.clear()
}
