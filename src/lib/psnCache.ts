import { dropLease, readCache, readCacheEntry, takeLease, writeCache } from '@/lib/steamCache'
import { wantsFresh } from '@/lib/wantsFresh'
import { psnBackground } from '@/lib/psnBudget'
import { runLater } from '@/lib/runLater'
import { PRIVATE_CODE, PsnBusyError, PsnError, PsnSyncing } from '@/lib/psnErrors'

/**
 * How PSN's account-level reads are cached (#177): stale data instead of waiting on Sony, one fetch at a time
 * per key across instances, and a hidden profile remembered. Per-game entries (keyed by the game's last trophy,
 * so they never go stale) stay on `withSteamCache`.
 *
 * - A live entry is the answer.
 * - An expired one up to STALE_MS old is the answer too, and a fresh one is fetched in the background.
 * - With none, the fetch happens now (`cold: 'wait'`), or in the background while the route answers 202
 *   (`cold: 'background'`: what is too costly for a first visit, such as a year of trophies).
 * - The refresh button (`wantsFresh`) reads again only an entry at least REFRESH_MS old: once per 10 minutes.
 * - A hidden profile is remembered PRIVATE_MS, so its visits do not each ask Sony.
 */
export const STALE_MS = 7 * 24 * 60 * 60 * 1000
export const REFRESH_MS = 10 * 60 * 1000
const PRIVATE_MS = 10 * 60 * 1000
/** Longer than any fetch's deadlines; a crashed holder lets go after this. */
const LEASE_MS = 60_000
/** How long a reader waits for another instance's fetch of the same key before answering "busy". */
const WAIT_MS = 8_000
const POLL_MS = 500
/** A background fetch that failed is not tried again for 30 to 90 s, so a burst of visits does not retry together. */
const RETRY_MIN_MS = 30_000
const RETRY_JITTER_MS = 60_000

const inFlight = new Map<string, Promise<unknown>>()
const retryAt = new Map<string, number>()
const privateKey = (accountId: string) => `psn:private:${accountId}`

type Options = { accountId: string; userId?: string | null; cold?: 'wait' | 'background' }

export async function psnCached<T>(key: string, ttlMs: number, fetch: () => Promise<T>, options: Options): Promise<T> {
  const entry = await readCacheEntry<T>(key, STALE_MS)
  const refresh = Boolean(entry && entry.ageMs >= REFRESH_MS && (await wantsFresh()))
  if (entry?.live && !refresh) return entry.data
  const fill = () => fillOnce(key, ttlMs, fetch, options)
  if (entry && (!refresh || options.cold === 'background')) {
    inBackground(key, fill, refresh)
    return entry.data
  }
  if (!entry && options.cold === 'background') {
    inBackground(key, fill)
    throw new PsnSyncing()
  }
  try {
    return await fill()
  } catch (err) {
    // Sony slow or refusing is no reason to blank a page that has something to show.
    if (entry && err instanceof PsnError && !err.isPrivate && !err.notConfigured) return entry.data
    throw err
  }
}

/** When this key's data was fetched (ms since epoch), or null when there is none. */
export async function psnSyncedAt(key: string): Promise<number | null> {
  const entry = await readCacheEntry(key, STALE_MS)
  return entry ? Date.now() - entry.ageMs : null
}

/** Linking again after making the profile public must not wait out the memory of it being hidden. */
export async function forgetPsnPrivate(accountId: string): Promise<void> {
  await writeCache(privateKey(accountId), false, 1)
}

function inBackground(key: string, fill: () => Promise<unknown>, refresh = false): void {
  if ((retryAt.get(key) ?? 0) > Date.now() || inFlight.has(key)) return
  // Several visits before it runs each ask for it: the first one to run does it, the others find it done
  // (live, or for the refresh button, younger than REFRESH_MS).
  const done = (e: { ageMs: number; live: boolean } | null) => Boolean(e && (refresh ? e.ageMs < REFRESH_MS : e.live))
  const unlessDone = async () => (done(await readCacheEntry(key, STALE_MS)) ? undefined : fill())
  runLater(() =>
    psnBackground(unlessDone).catch((err: unknown) => {
      retryAt.set(key, Date.now() + RETRY_MIN_MS + Math.random() * RETRY_JITTER_MS)
      if (!(err instanceof PsnBusyError)) console.error('[psnCache] background', key.split(':').slice(0, 3).join(':'), err)
    }),
  )
}

/** One fetch per key on this instance (shared in flight), and one across instances (a lease). */
function fillOnce<T>(key: string, ttlMs: number, fetch: () => Promise<T>, { accountId, userId = null }: Options): Promise<T> {
  const pending = inFlight.get(key)
  if (pending) return pending as Promise<T>
  const run = (async () => {
    if (await readCache<boolean>(privateKey(accountId))) throw new PsnError('private (remembered)', PRIVATE_CODE)
    const lease = `psn:lease:${key}`
    if (!(await takeLease(lease, LEASE_MS))) return waitForOther<T>(key)
    try {
      const data = await fetch()
      await writeCache(key, data, ttlMs, userId)
      retryAt.delete(key)
      return data
    } catch (err) {
      if (err instanceof PsnError && err.isPrivate) await writeCache(privateKey(accountId), true, PRIVATE_MS)
      throw err
    } finally {
      await dropLease(lease)
    }
  })().finally(() => inFlight.delete(key))
  inFlight.set(key, run)
  return run
}

/** Another instance is fetching this key: its answer, once written, or "busy" if it takes too long. */
async function waitForOther<T>(key: string): Promise<T> {
  const started = Date.now()
  while (Date.now() - started < WAIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
    const entry = await readCacheEntry<T>(key, Date.now() - started)
    if (entry) return entry.data
  }
  throw new PsnBusyError()
}
