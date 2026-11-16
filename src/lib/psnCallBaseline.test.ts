/**
 * The PSN call counts (#175 baseline, #177 phase 2, #179 phase 4): how many requests reach Sony to link a profile,
 * what a visit waits for, what the sync worker reads after it, a refresh and a page navigation, by function.
 * Counted against a fake Sony (`test-utils/fakePsn`), an in-memory snapshot store and queue (`test-utils/memoryPsn`)
 * and an in-memory cache, through the real psnClient, psnSync and psnSnapshot: never the network, never a
 * database. What `after()` would run once the answer is sent (the queue's drain) is kept here and run when the test
 * says (`background`), so what a visit waits for and what the worker does are counted apart.
 *
 * Rerun and print the tables:   PSN_BASELINE=1 npx jest src/lib/psnCallBaseline --coverage=false
 * The numbers are asserted from the library's own shape, so a change that makes a call more or fewer fails here and
 * the table in docs/platforms/psn.md is redone. The phase 0 and phase 2 numbers are kept in that doc.
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
jest.mock('@/lib/runLater', () => ({ runLater: (task: () => Promise<unknown>) => mockQueued.push(task) }))
jest.mock('@/lib/psnStore', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnStore)
jest.mock('@/lib/psnQueue', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnQueue)
// The worker looks up the account each user has linked: user 7 has acc-1, user 8 acc-2.
jest.mock('@/lib/queryRows', () => ({ queryRows: jest.fn(async (_sql: string, [id]: [number]) => [{ psnaccountid: `acc-${id - 6}` }]) }))
jest.mock('@/lib/scoreRefresh', () => ({ runScoreAfterSync: jest.fn(async () => true) }))
jest.mock('@/lib/wantsFresh', () => ({ wantsFresh: jest.fn(async () => false) }))

import * as psnApi from 'psn-api'
import { memorySteamCache } from '@/test-utils/memorySteamCache'
import { memoryPsnQueue, memoryPsnStore } from '@/test-utils/memoryPsn'
import { FAKE_NOW, fakeLibrary, installFakePsn, type FakeGame, type FakeHits } from '@/test-utils/fakePsn'
import { PSN_FUNCTIONS, psnCallTotals, resetPsnCallStats, type PsnCallCounts } from '@/lib/psnCallStats'
import { findPsnAccount } from '@/lib/psnClient'
import { readPsnOnLink, syncLinkedPsn } from '@/lib/psnSync'
import { psnGame, psnLatestTrophies, psnLibrary, psnRecentTrophies, psnSummary } from '@/lib/psnSnapshot'

const mockQueued: (() => Promise<unknown>)[] = []
const ACCOUNT = 'acc-1'
const USER = '7'
const LANG = 'es-ES'
const MIN = 60_000
const YEAR_DAYS = 366

let clock = FAKE_NOW
let hits: FakeHits

const daysAgo = (g: FakeGame) => (FAKE_NOW - Date.parse(g.lastTrophyAt!)) / 86_400_000
const started = (lib: FakeGame[]) => lib.filter((g) => g.earned > 0)

/** The home's reads, as the page fires them together: summary, library, latest, 60 days, the year (header streak). */
const home = (account = ACCOUNT, user = USER) =>
  Promise.allSettled([
    psnSummary(account, user),
    psnLibrary(account, user),
    psnLatestTrophies(account, user, LANG),
    psnRecentTrophies(account, 60, user, LANG),
    psnRecentTrophies(account, YEAR_DAYS, user, LANG),
  ])

/** What runs after the answers were sent (the queue's drains), until nothing is left. */
async function background() {
  while (mockQueued.length) await mockQueued.shift()!()
}

/** What the link route does: the search, the summary now, the rest queued. */
async function link(user = USER) {
  const found = await findPsnAccount('player')
  await readPsnOnLink(user === USER ? ACCOUNT : 'acc-2', LANG)
  await syncLinkedPsn(user)
  return found
}

/** The requests `run` made, by function, plus the same count taken at the fake Sony as a cross-check. */
async function measure(run: () => Promise<unknown>): Promise<PsnCallCounts> {
  const before = psnCallTotals()
  const fakeBefore = Object.values(hits).reduce((a, b) => a + b, 0)
  await run()
  const after = psnCallTotals()
  const counts: PsnCallCounts = {}
  for (const fn of PSN_FUNCTIONS) if ((after[fn] ?? 0) - (before[fn] ?? 0) > 0) counts[fn] = (after[fn] ?? 0) - (before[fn] ?? 0)
  expect(total(counts)).toBe(Object.values(hits).reduce((a, b) => a + b, 0) - fakeBefore)
  return counts
}

const total = (counts: PsnCallCounts) => Object.values(counts).reduce((a, b) => a + b, 0)

const report: string[] = []
function note(title: string, rows: [string, PsnCallCounts][]) {
  const head = `| ${title} | ${PSN_FUNCTIONS.join(' | ')} | total |\n|---|${PSN_FUNCTIONS.map(() => '--:').join('|')}|--:|`
  report.push([head, ...rows.map(([name, c]) => `| ${name} | ${PSN_FUNCTIONS.map((fn) => c[fn] ?? 0).join(' | ')} | ${total(c)} |`)].join('\n'))
}

async function setUp(lib: FakeGame[]) {
  // A drain the last test left queued holds the worker's "draining" flag until it runs.
  await background()
  jest.clearAllMocks()
  memorySteamCache.clear()
  memoryPsnStore.clear()
  memoryPsnQueue.clear()
  mockQueued.length = 0
  resetPsnCallStats()
  clock = FAKE_NOW
  hits = installFakePsn(psnApi, lib)
  process.env.PSN_NPSSO = 'npsso'
  // One call to sign in, so the measured scenarios do not pay for this instance's first token.
  await findPsnAccount('someone')
  resetPsnCallStats()
  hits = installFakePsn(psnApi, lib)
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockImplementation(() => clock)
  jest.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())
afterAll(() => {
  if (process.env.PSN_BASELINE) process.stdout.write(`\n${report.join('\n\n')}\n\n`)
})

describe.each([500, 1000])('a profile of %i games', (count) => {
  const lib = fakeLibrary(count)
  const titlePages = Math.ceil(count / 800)
  const playedPages = Math.ceil(lib.filter((g) => g.playedId).length / 200)
  const dlc = started(lib).filter((g) => g.hasDlc).length

  beforeEach(() => setUp(lib))

  test('linking it: the search and the summary, nothing else waits', async () => {
    const counts = await measure(link)
    expect(counts).toEqual({ search: 1, summary: 1, profile: 1 })
  })

  test('the first visit waits for no Sony call; the worker reads the rest once, then every read is the database', async () => {
    await link()
    const visit = await measure(home)
    expect(visit).toEqual({})
    // Nothing stored yet: every read answers 202 (the summary too: the list is not there yet).
    expect((await home()).every((r) => r.status === 'rejected')).toBe(true)

    const sync = await measure(background)
    // The list, the played list and 20 trophy sets, then each started game: its earned trophies and its
    // definitions (shared), and for a game with DLC its groups (earned + definitions).
    expect(sync).toEqual({ titles: titlePages, played: playedPages, sets: 4, gameTrophies: 2 * started(lib).length, gameGroups: 2 * dlc })
    expect(memoryPsnQueue.history()).toEqual(expect.arrayContaining(['titles', 'recent', 'history', 'score']))
    note(`${count} games, link and first visit`, [['the visit waits for', visit], ['the worker, after it', sync]])

    const again = await measure(home)
    expect(again).toEqual({})
    const settled = await home()
    expect(settled.every((r) => r.status === 'fulfilled')).toBe(true)
    expect((settled[4] as PromiseFulfilledResult<unknown[]>).value.length).toBeGreaterThan(0)
  })

  test("a second player of the same games pays only their own half: the definitions are everyone's", async () => {
    await link()
    await background()
    const second = await measure(async () => {
      await link('8')
      await home('acc-2', '8')
      await background()
    })
    expect(second.gameTrophies).toBe(started(lib).length)
    note(`${count} games, a second player, everything`, [['link + visit + worker', second]])
  })

  test('a visit 15 minutes later waits for nothing; the worker checks the summary alone when nothing moved', async () => {
    await link()
    await background()
    clock += 15 * MIN + 1000
    const visit = await measure(home)
    expect(visit).toEqual({})
    const sync = await measure(background)
    expect(sync).toEqual({ summary: 1 })
    note(`${count} games, 15 minutes later, nothing new`, [['the visit', visit], ['the worker', sync]])
  })

  test('a new trophy: the summary, the list and the played list, and that one game (the delta)', async () => {
    await link()
    await background()
    clock += 15 * MIN + 1000
    const moved = started(lib).find((g) => g.earned < 3 && !g.hasDlc)!
    const updated = lib.map((g) => (g === moved ? { ...g, earned: g.earned + 1, lastTrophyAt: new Date(clock).toISOString() } : g))
    hits = installFakePsn(psnApi, updated)
    await home()
    const sync = await measure(background)
    expect(sync).toEqual({ summary: 1, profile: 1, titles: titlePages, played: playedPages, sets: 4, gameTrophies: 1 })
    note(`${count} games, one new trophy`, [['the worker', sync]])
  })

  test('a navigation: a game this year, an older one and the library, with the sync done, cost nothing', async () => {
    await link()
    await background()
    const inYear = started(lib).find((g) => daysAgo(g) > 60 && daysAgo(g) < YEAR_DAYS)!
    const old = started(lib).find((g) => daysAgo(g) > YEAR_DAYS)!
    const nav = {
      'a game from this year': await measure(() => psnGame(ACCOUNT, inYear.titleId, USER, LANG)),
      'a game older than a year': await measure(() => psnGame(ACCOUNT, old.titleId, USER, LANG)),
      library: await measure(() => psnLibrary(ACCOUNT, USER)),
    }
    note(`${count} games, navigating`, Object.entries(nav))
    expect(Object.values(nav).every((c) => total(c) === 0)).toBe(true)
  })

  test('a game never started, opened: 202, then the worker reads its definitions alone (1 request)', async () => {
    const unstarted = lib.find((g) => g.earned === 0)!
    await link()
    await background()
    await expect(psnGame(ACCOUNT, unstarted.titleId, USER, LANG)).rejects.toThrow('syncing')
    expect(await measure(background)).toEqual({ gameTrophies: 1 })
    expect((await psnGame(ACCOUNT, unstarted.titleId, USER, LANG))!.trophies).toHaveLength(3)
  })
})
