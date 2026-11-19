import { AsyncLocalStorage } from 'node:async_hooks'
import { reserveAttempt } from '@/lib/attemptLimit'
import { countUpstream } from '@/lib/upstreamCount'
import { recordPsnCall, type PsnFunction } from '@/lib/psnCallStats'
import { PsnBusyError } from '@/lib/psnErrors'
import type { PoolAccount } from '@/lib/psnAccounts'

/**
 * The budget for every request to Sony (#177), per service account since the pool (#178): an account may make
 * `rate_per_min` × 15 calls in 15 minutes (40 a minute by default, 600 per window: one account is exactly what
 * phase 2 allowed the whole app), counted in the database (`attemptLimit`'s 'psn-upstream', keyed by the
 * account), so it holds across instances. The pool's capacity is the sum of its accounts'.
 *
 * Work nobody is waiting for (the score fill, the year, the enrichment) runs inside `psnBackground` and may
 * spend only BACKGROUND_SHARE of an account's budget: the rest is kept for someone opening a page. A call
 * refused here never reaches Sony; the pool then tries another account. Sony's own "too many requests" rests
 * the account itself (`psnAccounts.finishPsnLease`), not the app.
 */
export const BACKGROUND_SHARE = 0.75
const WINDOW_MINUTES = 15

const background = new AsyncLocalStorage<true>()

/** Runs `work` as background work: its calls to Sony stop at the background share of each account's budget. */
export function psnBackground<T>(work: () => Promise<T>): Promise<T> {
  return background.run(true, work)
}

/** Takes one call from the account's budget; false when it is spent. */
export async function takePsnCall(account: Pick<PoolAccount, 'id' | 'ratePerMin'>): Promise<boolean> {
  const max = account.ratePerMin * WINDOW_MINUTES
  const reservation = await reserveAttempt('psn-upstream', `account:${account.id}`, background.getStore() ? Math.floor(max * BACKGROUND_SHARE) : max)
  if (!reservation.allowed) await reservation.release()
  return reservation.allowed
}

/** One request's worth of the account's budget, counted under `fn`; PsnBusyError when it is spent. */
export async function spendPsnCall(account: Pick<PoolAccount, 'id' | 'ratePerMin'>, fn: PsnFunction): Promise<void> {
  if (!(await takePsnCall(account))) throw new PsnBusyError()
  countUpstream('psn')
  recordPsnCall(fn)
}
