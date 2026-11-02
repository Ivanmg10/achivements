import { fetchShared } from '@/lib/fetchShared'
import type { Bootstrap } from '@/lib/meBootstrap'

/**
 * How long after it was asked for the bootstrap still answers a first read. The
 * three readers (preferences, hidden games, Vault Points) mount with the app, so
 * this only has to cover the first paint; anything later asks its own route.
 * ponytail: a time window, not invalidation — a reader that mounts inside it right
 * after a change would read the start-up value; per-part invalidation if that happens.
 */
const FRESH_MS = 10_000

let current: { user: string; at: number; answer: Promise<Bootstrap | null> } | null = null

async function fetchBootstrap(): Promise<Bootstrap | null> {
  try {
    const res = await fetchShared('/api/me/bootstrap', { cache: 'no-store' })
    if (!res.ok) throw new Error(`me/bootstrap ${res.status}`)
    const data = (await res.json()) as Bootstrap
    if (!data || typeof data !== 'object') throw new Error('Unexpected bootstrap')
    return data
  } catch (err) {
    // Each reader then asks its own route: nothing is lost but a request.
    console.error('[bootstrap]', err)
    return null
  }
}

/**
 * One part of the signed-in user's start-up data (`/api/me/bootstrap`), for a
 * reader's first read: one request for all three instead of one each (#101).
 * Null when it is too late (a reader mounted later), the read failed, or the part
 * did: the reader then asks its own route, as it always did.
 */
export function bootstrapPart<K extends keyof Bootstrap>(user: string, part: K): Promise<Bootstrap[K] | null> {
  if (!current || current.user !== user) current = { user, at: Date.now(), answer: fetchBootstrap() }
  else if (Date.now() - current.at > FRESH_MS) return Promise.resolve(null)
  return current.answer.then((data) => data?.[part] ?? null)
}

/** Forgets the start-up data, for tests. Another account asks again on its own (`user` differs). */
export function resetBootstrap() {
  current = null
}
