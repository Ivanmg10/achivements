/**
 * Load and chaos (#180, phase 5 of epic #174): many links at once, and Sony misbehaving, through the real link
 * path, sync worker and readers, against a fake Sony (`test-utils/fakePsn`), an in-memory store and queue
 * (`test-utils/memoryPsn`) and an in-memory pool (`test-utils/fakePsnAccounts`). Never the network or a database.
 *
 * What it holds to:
 * - **No 5xx** from a PSN page read, whatever happens: the store answers (200), a first sync is on its way (202),
 *   the pool is out of calls (429). A read is mapped to its status exactly as the routes do (`psnFailure`).
 * - **The core lands for everyone**, in queue order: every link's trophy list before anyone's play data.
 * - **The core's wait** is modelled from the calls ahead of each link and the pool's background rate (an
 *   account's 40 calls a minute, three quarters for the worker): p95 under 60 s for 10 links on one account and
 *   100 on five; 1,000 at once on five is printed, not promised (Sony's budget is the ceiling, docs/platforms/psn.md).
 * - **Chaos**: one account refused (429) or its token expired is invisible; Sony's 5xx are retried until the
 *   core lands; every account down or a dead worker serve what is stored, and new links wait (202), never 5xx.
 *
 * Print the table: PSN_LOAD=1 npx jest src/lib/psnLoad --coverage=false
 */
jest.mock('psn-api', () => ({
  exchangeNpssoForAccessCode: jest.fn(),
  exchangeAccessCodeForAuthTokens: jest.fn(),
  exchangeRefreshTokenForAuthTokens: jest.fn(),
  makeUniversalSearch: jest.fn(),
  getUserTrophyProfileSummary: jest.fn(),
  getUserTitles: jest.fn(),
  getProfileFromAccountId: jest.fn(),
  getTitleTrophies: jest.fn(),
  getUserTrophiesEarnedForTitle: jest.fn(),
  getUserPlayedGames: jest.fn(),
  getUserTrophiesForSpecificTitle: jest.fn(),
  getTitleTrophyGroups: jest.fn(),
  getUserTrophyGroupEarningsForTitle: jest.fn(),
}))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: () => Promise.reject(new Error('no database in this test')) } }))
jest.mock('@/lib/upstreamCount', () => ({ countUpstream: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({ PSN_CALLS_PER_WINDOW: 600, reserveAttempt: jest.fn(async () => ({ allowed: true, release: async () => {} })) }))
jest.mock('@/lib/psnAccounts', () => jest.requireActual('@/test-utils/fakePsnAccounts').fakePsnStore)
jest.mock('@/lib/psnMaintenance', () => ({ maybeMaintainPsnPool: jest.fn() }))
jest.mock('@/lib/steamCache', () => jest.requireActual('@/test-utils/memorySteamCache').memorySteamCache)
jest.mock('@/lib/igdbClient', () => ({ igdbConfigured: () => false, igdbPlatforms: () => [], igdbArt: jest.fn() }))
// The kicks after traffic are dropped: the test drains the queue itself (or not, for a dead worker).
jest.mock('@/lib/runLater', () => ({ runLater: jest.fn() }))
jest.mock('@/lib/psnStore', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnStore)
jest.mock('@/lib/psnQueue', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnQueue)
// User n has linked PSN account acc-n.
jest.mock('@/lib/queryRows', () => ({ queryRows: jest.fn(async (_sql: string, [id]: [number]) => [{ psnaccountid: `acc-${id}` }]) }))
jest.mock('@/lib/scoreRefresh', () => ({ runScoreAfterSync: jest.fn(async () => true) }))
jest.mock('@/lib/wantsFresh', () => ({ wantsFresh: jest.fn(async () => false) }))

import * as psnApi from 'psn-api'
import { memorySteamCache } from '@/test-utils/memorySteamCache'
import { memoryPsnQueue, memoryPsnStore } from '@/test-utils/memoryPsn'
import { fakePsnStore } from '@/test-utils/fakePsnAccounts'
import { FAKE_NOW, fakeLibrary, installFakePsn } from '@/test-utils/fakePsn'
import { psnCallTotals, resetPsnCallStats } from '@/lib/psnCallStats'
import { forgetPsnTokens, psnFailure } from '@/lib/psnClient'
import { RATE_LIMIT_CODE } from '@/lib/psnErrors'
import { resetPsnPoolSeed } from '@/lib/psnPool'
import { readPsnOnLink, runPsnJob, syncLinkedPsn } from '@/lib/psnSync'
import { psnLibrary, psnSummary } from '@/lib/psnSnapshot'

type Api = Record<string, jest.Mock>
const api = psnApi as unknown as Api
const LIB = fakeLibrary(6)
/** An account's background share: 40 calls a minute, three quarters for the worker. */
const WORKER_PER_ACCOUNT_MIN = 30
const MIN = 60_000

let clock = FAKE_NOW
const report: string[] = []

const calls = () => Object.values(psnCallTotals()).reduce((a, b) => a + (b ?? 0), 0)
const users = (n: number, from = 1) => Array.from({ length: n }, (_, i) => String(from + i))
const p95 = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.max(0, Math.ceil(xs.length * 0.95) - 1)]

/** A page read as the route answers it: 200 from the store, else psnFailure's status. */
async function status(read: () => Promise<unknown>): Promise<number> {
  try {
    await read()
    return 200
  } catch (err) {
    return psnFailure(err, 'psnLoad').status
  }
}

/** The home's two first reads for each user, as statuses. */
async function readAll(ids: string[]): Promise<number[]> {
  const out = await Promise.all(ids.map(async (u) => [await status(() => psnSummary(`acc-${u}`, u)), await status(() => psnLibrary(`acc-${u}`, u))]))
  return out.flat()
}

/** What the link route does once the search found the account: the summary now, the rest queued. A failure is its status. */
async function link(u: string): Promise<number> {
  return status(async () => {
    await readPsnOnLink(`acc-${u}`, 'en-US')
    await syncLinkedPsn(u)
  })
}

/** Runs the worker until nothing is left, a minute of the clock between rounds so retries come due. */
async function drain(maxRounds = 30): Promise<void> {
  for (let round = 0; round < maxRounds; round++) {
    await memoryPsnQueue.drainPsnQueue(runPsnJob)
    if (memoryPsnQueue.queued() === 0) return
    clock += 61_000
  }
}

/** Each user's core (trophy list) as it lands, in the worker's calls made before it: the wait is modelled from that. */
function watchCores(): Map<string, number> {
  const landed = new Map<string, number>()
  const start = calls()
  const save = memoryPsnStore.savePsnTitles.bind(memoryPsnStore)
  jest.spyOn(memoryPsnStore, 'savePsnTitles').mockImplementation(async (accountId, list) => {
    if (!landed.has(accountId)) landed.set(accountId, calls() - start)
    return save(accountId, list)
  })
  return landed
}

/** Each sign-in gets its own token, so a fault can pick on one account. */
function distinctTokens() {
  let n = 0
  const tokens = () => ({ accessToken: `token-${++n}`, refreshToken: `refresh-${n}`, expiresIn: 3600, refreshTokenExpiresIn: 86400 })
  api.exchangeAccessCodeForAuthTokens.mockImplementation(async () => tokens())
  api.exchangeRefreshTokenForAuthTokens.mockImplementation(async () => tokens())
}
const accountOf = (auth: { accessToken: string }) => fakePsnStore.accounts.find((a) => a.tokens?.accessToken === auth.accessToken)?.id

/** Makes `fn` fail with `fault` whenever `when` says so, else answer as the fake Sony does. */
function fault(fn: string, when: (auth: { accessToken: string }) => boolean, error: () => unknown) {
  const real = api[fn].getMockImplementation()!
  api[fn].mockImplementation(async (auth: { accessToken: string }, ...rest: unknown[]) => (when(auth) ? error() : real(auth, ...rest)))
}
const tooMany = () => ({ error: { message: 'Too Many Requests', code: RATE_LIMIT_CODE } })
const expired = () => ({ error: { message: 'Invalid token', code: 2241 } })
const serverDown = () => Promise.reject(new TypeError('fetch failed'))

function setUp(accounts: number) {
  jest.restoreAllMocks()
  jest.spyOn(Date, 'now').mockImplementation(() => clock)
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  clock = FAKE_NOW
  memorySteamCache.clear()
  memoryPsnStore.clear()
  memoryPsnQueue.clear()
  resetPsnCallStats()
  resetPsnPoolSeed()
  forgetPsnTokens()
  fakePsnStore.reset(Array.from({ length: accounts }, (_, i) => ({ id: i + 1 })))
  installFakePsn(psnApi, LIB)
  distinctTokens()
}

afterAll(() => {
  if (process.env.PSN_LOAD) process.stdout.write(`\n| links at once | accounts | worker calls a minute | core p95 | last core |\n|--:|--:|--:|--:|--:|\n${report.join('\n')}\n\n`)
})

describe.each([
  [10, 1, true],
  [100, 5, true],
  [1000, 5, false],
])('%i links at once, %i accounts', (count, accounts, promised) => {
  test('no 5xx at any point, every core lands in link order, and the wait is modelled', async () => {
    setUp(accounts)
    const ids = users(count)
    const links = await Promise.all(ids.map(link))
    expect(links.every((s) => s === 200)).toBe(true)
    // Before the worker runs: every read waits for the first sync, none fails.
    expect(new Set(await readAll(ids))).toEqual(new Set([202]))
    const landed = watchCores()
    await drain()
    expect(landed.size).toBe(count)
    expect(new Set(await readAll(ids))).toEqual(new Set([200]))
    // Every link's list before anyone's play data: the core costs one call per link.
    expect([...landed.values()].every((at, i, all) => i === 0 || at >= all[i - 1])).toBe(true)
    expect(Math.max(...landed.values())).toBeLessThanOrEqual(count)
    const perMin = accounts * WORKER_PER_ACCOUNT_MIN
    const seconds = [...landed.values()].map((ahead) => ((ahead + 1) / perMin) * 60)
    report.push(`| ${count} | ${accounts} | ${perMin} | ${Math.round(p95(seconds))} s | ${Math.round(Math.max(...seconds))} s |`)
    if (promised) expect(p95(seconds)).toBeLessThan(60)
  }, 60_000)
})

describe('chaos', () => {
  const ids = users(20)

  test('one account refused (429 on every call): invisible, the other carries the load', async () => {
    setUp(2)
    fault('getUserTitles', (auth) => accountOf(auth) === 1, tooMany)
    await Promise.all(ids.map(link))
    await drain()
    expect(new Set(await readAll(ids))).toEqual(new Set([200]))
    expect(fakePsnStore.accounts[0].outcomes).toContain('rate-limited')
  })

  test("an account's token expired: dropped, signed in again, nobody notices", async () => {
    setUp(2)
    // The first token of each account has expired: refused once, then a new sign-in works.
    const stale = new Set(['token-1', 'token-2'])
    fault('getUserTitles', (auth) => stale.delete(auth.accessToken), expired)
    await Promise.all(ids.map(link))
    await drain()
    expect(new Set(await readAll(ids))).toEqual(new Set([200]))
    expect(fakePsnStore.accounts.flatMap((a) => a.outcomes)).toContain('auth')
    expect(api.exchangeRefreshTokenForAuthTokens.mock.calls.length + api.exchangeAccessCodeForAuthTokens.mock.calls.length).toBeGreaterThan(2)
  })

  test("Sony's 5xx on a third of the list reads: retried until every core lands, reads never 5xx", async () => {
    setUp(2)
    let n = 0
    fault('getUserTitles', () => ++n % 3 === 0, serverDown)
    await Promise.all(ids.map(link))
    const seen = await readAll(ids)
    await drain()
    seen.push(...(await readAll(ids)))
    expect(seen.every((s) => s < 500)).toBe(true)
    expect(new Set(await readAll(ids))).toEqual(new Set([200]))
  })

  test('every account down: what is stored is served, a new link waits or is told to come back, never a 5xx', async () => {
    setUp(2)
    const synced = ids.slice(0, 10)
    await Promise.all(synced.map(link))
    await drain()
    for (const a of fakePsnStore.accounts) a.cooldownUntil = clock + 60 * MIN
    clock += 20 * MIN
    // Old data (a sync is queued after the answer) and no account to read it with: still 200.
    expect(new Set(await readAll(synced))).toEqual(new Set([200]))
    const late = ids.slice(10)
    const linked = await Promise.all(late.map(link))
    expect(new Set(linked)).toEqual(new Set([429]))
    await drain(3)
    expect((await readAll(synced)).every((s) => s === 200)).toBe(true)
  })

  test('a dead worker: linked accounts wait (202), synced ones are served, never a 5xx', async () => {
    setUp(2)
    const synced = ids.slice(0, 10)
    await Promise.all(synced.map(link))
    await drain()
    const waiting = ids.slice(10)
    await Promise.all(waiting.map(link))
    // Nothing drains from here on.
    clock += 60 * MIN
    expect(new Set(await readAll(waiting))).toEqual(new Set([202]))
    expect(new Set(await readAll(synced))).toEqual(new Set([200]))
  })
})
