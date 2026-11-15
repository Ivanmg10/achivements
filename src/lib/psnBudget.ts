import { AsyncLocalStorage } from 'node:async_hooks'
import { PSN_CALLS_PER_WINDOW, reserveAttempt } from '@/lib/attemptLimit'
import { readCache, writeCache } from '@/lib/steamCache'

/**
 * One budget for every request to Sony (#177), for the whole app: PSN_CALLS_PER_WINDOW calls in 15 minutes,
 * counted in the database (`attemptLimit`'s 'psn-upstream'), so it holds across instances. Work nobody is
 * waiting for (the score fill, the year, the enrichment) runs inside `psnBackground` and may spend only
 * BACKGROUND_SHARE of it: the rest is kept for someone opening a page. A call refused here never reaches Sony.
 *
 * When Sony itself answers "too many requests" twice, `psnRateLimited` empties the bucket for every instance
 * until COOLDOWN_MS have passed. Sony is reported to send `X-RateLimit-Next-Available` with its 429, but
 * psn-api returns only the body, so the wait is fixed.
 */
const BACKGROUND_SHARE = 0.75
const BACKGROUND_MAX = Math.floor(PSN_CALLS_PER_WINDOW * BACKGROUND_SHARE)
const COOLDOWN_KEY = 'psn:cooldown'
export const COOLDOWN_MS = 60_000

const background = new AsyncLocalStorage<true>()

/** Runs `work` as background work: its calls to Sony stop at the background share of the budget. */
export function psnBackground<T>(work: () => Promise<T>): Promise<T> {
  return background.run(true, work)
}

/** Takes one call from the budget; false when it is spent (or Sony asked everyone to wait). */
export async function takePsnCall(): Promise<boolean> {
  if (await readCache<number>(COOLDOWN_KEY)) return false
  const reservation = await reserveAttempt('psn-upstream', 'app', background.getStore() ? BACKGROUND_MAX : PSN_CALLS_PER_WINDOW)
  if (!reservation.allowed) await reservation.release()
  return reservation.allowed
}

/** Sony refused twice: nobody asks again for a minute. */
export async function psnRateLimited(): Promise<void> {
  await writeCache(COOLDOWN_KEY, Date.now() + COOLDOWN_MS, COOLDOWN_MS)
}
