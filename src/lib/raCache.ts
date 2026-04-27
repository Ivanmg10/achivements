type Entry = { data: unknown; expiresAt: number }

const store = new Map<string, Entry>()

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() < hit.expiresAt) return hit.data as T
  const data = await fetcher()
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
  return data
}

export function clearCache(): void {
  store.clear()
}
