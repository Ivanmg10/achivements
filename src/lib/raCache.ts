type Entry = { data: unknown; expiresAt: number }

const store = new Map<string, Entry>()

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
  const data = await fetcher()
  if (!shouldCache || shouldCache(data)) {
    store.set(key, { data, expiresAt: Date.now() + ttlMs })
  }
  return data
}

export function clearCache(): void {
  store.clear()
}
