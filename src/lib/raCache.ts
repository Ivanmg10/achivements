type Entry = { data: unknown; expiresAt: number }

const store = new Map<string, Entry>()
const inFlight = new Map<string, Promise<unknown>>()

if (process.env.NODE_ENV === 'development') {
  store.clear()
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
      if (!shouldCache || shouldCache(data)) {
        store.set(key, { data, expiresAt: Date.now() + ttlMs })
      }
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
