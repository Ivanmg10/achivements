import {
  finishPsnLease,
  leasePsnAccount,
  psnPoolState,
  releasePsnLease,
  seedPsnPool,
  type PoolAccount,
  type PsnLease,
  type PsnOutcome,
} from '@/lib/psnAccounts'
import { NOT_CONFIGURED, PsnBusyError, PsnError, TIMED_OUT } from '@/lib/psnErrors'
import { forgetPsnAccountTokens } from '@/lib/psnTokens'

/**
 * The pool of PSN service accounts (#178). Any account can read any public profile, so every call to Sony
 * (`psnCall`) runs on whichever account is free: a weighted choice among the active ones out of cooldown,
 * one concurrency slot (lease) per call, within the account's own budget (psnBudget).
 *
 * When a call fails on one account:
 * - Sony's "too many requests", a server error or no answer: it runs again on another account, twice at most.
 * - Sony refused the account's token: its tokens are dropped (a refused sign-in then quarantines it) and the
 *   call runs on another.
 * - The account's own budget is spent: another account, at no cost to its health.
 * - A hidden profile, a profile that does not exist, anything else that is the profile's answer: never again.
 *
 * With one account (today) there is no other: after a 429 it waits 2 s and asks the same account once more,
 * and after a refused token it signs in again at once, as the single-account client did.
 */
const MAX_RETRIES = 2
const RATE_LIMIT_WAIT_MS = 2_000
/** All the slots of the usable accounts are taken: wait this long (plus jitter) for one, this many times. */
const SLOT_WAIT_MS = 150
const SLOT_WAITS = 20

type Failure = PsnOutcome | 'busy' | 'final'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** What a failed call says about the account that made it. */
export function failureOf(err: unknown): Exclude<Failure, 'ok'> {
  if (err instanceof PsnBusyError) return 'busy'
  if (!(err instanceof PsnError)) return 'server' // the network, or a body that was not JSON
  if (err.isAuth) return 'auth'
  if (err.isRateLimited) return 'rate-limited'
  if (err.code === TIMED_OUT) return 'server'
  return 'final'
}

let seeding: Promise<void> | null = null

/** A free slot on an account not in `exclude`, waiting a moment when the usable ones are all busy. */
async function acquire(exclude: number[]): Promise<PsnLease | null> {
  for (let wait = 0; wait <= SLOT_WAITS; wait++) {
    const lease = await leasePsnAccount(exclude)
    if (lease) return lease
    const state = await psnPoolState(exclude)
    if (state === 'resting') return null
    if (state === 'empty') {
      if (seeding) throw new PsnError('PSN is not configured: no service account', NOT_CONFIGURED)
      seeding = seedPsnPool().catch((err) => {
        seeding = null
        throw err
      })
      await seeding
      continue
    }
    await sleep(SLOT_WAIT_MS + Math.random() * SLOT_WAIT_MS)
  }
  return null
}

/** The next account to try: one not tried yet, else (one account) the same one a second time. */
async function nextLease(tried: number[], last: unknown): Promise<PsnLease | null> {
  const other = await acquire(tried)
  if (other || last === null) return other
  const failure = failureOf(last)
  if (failure !== 'rate-limited' && failure !== 'auth') return null
  const twice = tried.filter((id, i) => tried.indexOf(id) !== i)
  if (twice.length === new Set(tried).size) return null
  if (failure === 'rate-limited') await sleep(RATE_LIMIT_WAIT_MS)
  return acquire(twice)
}

/** Gives the slot back and records the call; a database hiccup here must not hide the call's own answer. */
async function finish(lease: PsnLease, failure: Failure): Promise<void> {
  try {
    if (failure === 'busy') return await releasePsnLease(lease)
    if (failure === 'auth') await forgetPsnAccountTokens(lease.account.id)
    await finishPsnLease(lease, failure === 'final' ? 'ok' : failure)
  } catch (err) {
    console.error('[psnPool] could not record the call', lease.account.label, err)
  }
}

/** Runs `work` (one request to Sony) on an account of the pool, moving to another when that one fails. */
export async function withPsnAccount<T>(work: (account: PoolAccount) => Promise<T>): Promise<T> {
  const tried: number[] = []
  let last: unknown = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const lease = await nextLease(tried, last)
    if (!lease) break
    tried.push(lease.account.id)
    try {
      const result = await work(lease.account)
      await finish(lease, 'ok')
      return result
    } catch (err) {
      last = err
      const failure = failureOf(err)
      await finish(lease, failure)
      if (failure === 'final') throw err
    }
  }
  throw last ?? new PsnBusyError()
}

/** Whether PSN can be called at all: an account is set up (today's is copied in on first use). */
export async function psnPoolConfigured(): Promise<boolean> {
  if ((await psnPoolState()) !== 'empty') return true
  await seedPsnPool()
  return (await psnPoolState()) !== 'empty'
}

/** For tests: the next empty pool is seeded again. */
export function resetPsnPoolSeed(): void {
  seeding = null
}
