/**
 * The PSN call counts (#175 baseline, #177 phase 2): how many requests reach Sony for a cold profile, the
 * background work after it, a refresh and a page navigation, by function. Counted against a fake Sony
 * (`test-utils/fakePsn`) and an in-memory cache with the real TTLs, through the real psnClient and psnCache:
 * never the network, never a database. What `after()` would run once the answer is sent is queued here and run
 * when the test says (`background`), so what a visit waits for and what comes after are counted apart.
 *
 * Rerun and print the tables:   PSN_BASELINE=1 npx jest src/lib/psnCallBaseline --coverage=false
 * The numbers are asserted from the library's own shape, so a change that makes a
 * call more or fewer fails here and the table in docs/platforms/psn.md is redone.
 * The phase 0 numbers (356 / 709 for a cold home) are kept in that doc.
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
jest.mock('@/lib/psnCredentials', () => ({
  loadPsnCredentials: jest.fn(async () => null),
  savePsnTokens: jest.fn(async () => {}),
  savePsnNpsso: jest.fn(async () => {}),
  npssoExpiry: jest.fn(async () => null),
}))
jest.mock('@/lib/steamCache', () => jest.requireActual('@/test-utils/memorySteamCache').memorySteamCache)
jest.mock('@/lib/igdbClient', () => ({ igdbConfigured: () => false, igdbPlatforms: () => [], igdbArt: jest.fn() }))
jest.mock('@/lib/runLater', () => ({ runLater: (task: () => Promise<unknown>) => queued.push(task) }))

import * as psnApi from 'psn-api'
import { memorySteamCache } from '@/test-utils/memorySteamCache'
import { FAKE_NOW, fakeLibrary, installFakePsn, type FakeGame, type FakeHits } from '@/test-utils/fakePsn'
import { PSN_FUNCTIONS, psnCallTotals, resetPsnCallStats, type PsnCallCounts } from '@/lib/psnCallStats'
import { mapLimit } from '@/utils/utils'
import { findPsnAccount, findPsnGame, psnGameGroups, psnGameTrophies, psnLatestTrophies, psnLibrary, psnRecentTrophies, psnSummary, psnTitlesCore } from '@/lib/psnClient'

const queued: (() => Promise<unknown>)[] = []
const ACCOUNT = 'acc-1'
const USER = '7'
/** The reader's language; the completion dates and the score read in English (the default), so their defined trophies are kept apart. */
const LANG = 'es-ES'
const MIN = 60_000
const YEAR_DAYS = 366

let clock = FAKE_NOW
let hits: FakeHits

const daysAgo = (g: FakeGame) => (FAKE_NOW - Date.parse(g.lastTrophyAt!)) / 86_400_000
const started = (lib: FakeGame[]) => lib.filter((g) => g.earned > 0)
const within = (lib: FakeGame[], days: number) => started(lib).filter((g) => daysAgo(g) <= days)

/** The home's reads, as the page fires them together: summary, library, latest, 60 days, the year (header streak). */
const home = (account = ACCOUNT) =>
  Promise.allSettled([
    psnSummary(account, USER),
    psnLibrary(account, USER),
    psnLatestTrophies(account, USER, LANG),
    psnRecentTrophies(account, 60, USER, LANG),
    psnRecentTrophies(account, YEAR_DAYS, USER, LANG),
  ])

/** What runs after the answers were sent, until nothing is left (a task may queue another). */
async function background() {
  while (queued.length) await queued.shift()!()
}

/** What /api/psn/trophies does for one game. */
async function openGame(g: FakeGame) {
  const game = (await findPsnGame(ACCOUNT, g.titleId, USER))!
  await Promise.all([psnGameGroups(ACCOUNT, game, USER, LANG), psnGameTrophies(ACCOUNT, game, USER, LANG)])
}

/** The score fill's reads (scoreRefresh's psnPlan): every game with a trophy, 2 at a time, in the default language. */
async function scoreFill() {
  const games = (await psnTitlesCore(ACCOUNT, USER)).filter((g) => g.numAwarded > 0)
  await mapLimit(games, 2, (g) => psnGameTrophies(ACCOUNT, g, USER))
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
  jest.clearAllMocks()
  memorySteamCache.clear()
  queued.length = 0
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
  const year = within(lib, YEAR_DAYS)

  beforeEach(() => setUp(lib))

  test('linking it: the summary shares the core library, no count of its own', async () => {
    const link = await measure(async () => {
      const found = await findPsnAccount('player')
      await psnSummary(found!.accountId, USER)
    })
    expect(link).toEqual({ search: 1, summary: 1, profile: 1, titles: titlePages })
  })

  test('the first visit, cold: at most 10 requests; the rest comes after, in the background', async () => {
    const cold = await measure(home)
    // Summary 2, the title list (1 per 800 games), the latest 3 games' trophies (defined + earned each).
    expect(cold).toEqual({ summary: 1, profile: 1, titles: titlePages, gameTrophies: 6 })
    expect(total(cold)).toBeLessThanOrEqual(10)
    const [, , , sixty, theYear] = await home()
    expect(sixty.status).toBe('rejected')
    expect(theYear.status).toBe('rejected')

    const after = await measure(background)
    // The played list, the sets of the 20 most recent played games, the year game by game (defined trophies
    // only once per language, the latest 3 already read), and 20 completion dates (English: their own definitions).
    expect(after.played).toBe(playedPages)
    expect(after.sets).toBe(4)
    expect(after.titles ?? 0).toBe(0)
    note(`${count} games, first visit`, [['what the visit waits for', cold], ['what comes after, in the background', after]])

    // Everything has landed: the next visit costs nothing.
    const again = await measure(home)
    expect(again).toEqual({})
    const settled = await home()
    expect(settled.every((r) => r.status === 'fulfilled')).toBe(true)
    expect((settled[4] as PromiseFulfilledResult<unknown[]>).value.length).toBeGreaterThan(0)
  })

  test("a second player of the same games pays only their own half: the defined trophies are everyone's", async () => {
    await home()
    await background()
    const second = await measure(async () => {
      await home('acc-2')
      await background()
    })
    // Earned trophies only, for every game the first player's reads already defined.
    expect(second.gameTrophies).toBeLessThan(year.length + 20)
    note(`${count} games, a second player, everything`, [['visit + background', second]])
  })

  test('a refresh after 15 minutes waits for nothing: it is read again in the background', async () => {
    await home()
    await background()
    clock += 15 * MIN + 1000
    const visit = await measure(home)
    expect(visit).toEqual({})
    const after = await measure(background)
    // Summary 2, the title list, and the year rebuilt from per-game entries: nothing moved, so no game is read.
    expect(after).toEqual({ summary: 1, profile: 1, titles: titlePages })
    note(`${count} games, refreshed after 15 minutes`, [['the visit', visit], ['in the background', after]])
  })

  test('a navigation: a game, another, the library, cache warm', async () => {
    await home()
    await background()
    const inYear = year.find((g) => daysAgo(g) > 60)!
    const old = started(lib).find((g) => daysAgo(g) > YEAR_DAYS && !(g.hasDlc && (g.earned === 3 || g.platinum)))!
    const nav = {
      'a game from this year': await measure(() => openGame(inYear)),
      'a game older than a year': await measure(() => openGame(old)),
      library: await measure(() => psnLibrary(ACCOUNT, USER)),
    }
    note(`${count} games, navigating with a warm cache`, Object.entries(nav))
    expect(nav['a game from this year']).toEqual({ gameGroups: 2 })
    expect(nav['a game older than a year']).toEqual({ gameGroups: 2, gameTrophies: 2 })
    expect(nav.library).toEqual({})
  })

  test('the score fill, after the visit: the year and the completion dates already read are not read again', async () => {
    await home()
    await background()
    const score = await measure(scoreFill)
    // Every started game: earned once (any language), defined once in English.
    expect(score.gameTrophies).toBeLessThan(2 * started(lib).length)
    note(`${count} games, score fill after the visit`, [['score fill', score]])
  })
})
