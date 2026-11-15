/**
 * The PSN call baseline (#175): how many requests reach Sony for a cold profile,
 * a refresh and a page navigation, by function. Counted against a fake Sony
 * (`test-utils/fakePsn`) and an in-memory cache with the real TTLs, through the
 * real psnClient: never the network, never a database.
 *
 * Rerun and print the table:   PSN_BASELINE=1 npx jest src/lib/psnCallBaseline --coverage=false
 * The numbers are asserted from the library's own shape, so a change that makes a
 * call more or fewer fails here and the table in docs/platforms/psn.md is redone.
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
jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn(async () => ({ allowed: true, release: async () => {} })) }))
jest.mock('@/lib/psnCredentials', () => ({
  loadPsnCredentials: jest.fn(async () => null),
  savePsnTokens: jest.fn(async () => {}),
  savePsnNpsso: jest.fn(async () => {}),
  npssoExpiry: jest.fn(async () => null),
}))
jest.mock('@/lib/steamCache', () => jest.requireActual('@/test-utils/memorySteamCache').memorySteamCache)
jest.mock('@/lib/igdbClient', () => ({ igdbConfigured: () => false, igdbPlatforms: () => [], igdbArt: jest.fn() }))

import * as psnApi from 'psn-api'
import { memorySteamCache } from '@/test-utils/memorySteamCache'
import { FAKE_NOW, fakeLibrary, installFakePsn, type FakeGame, type FakeHits } from '@/test-utils/fakePsn'
import { PSN_FUNCTIONS, psnCallTotals, resetPsnCallStats, type PsnCallCounts } from '@/lib/psnCallStats'
import { mapLimit } from '@/utils/utils'
import {
  findPsnAccount,
  findPsnGame,
  psnGameGroups,
  psnGameTrophies,
  psnLatestTrophies,
  psnRecentTrophies,
  psnSummary,
  psnTitles,
  psnTitlesWithCompletion,
} from '@/lib/psnClient'

const ACCOUNT = 'acc-1'
const USER = '7'
/** The reader's language; the completion dates and the score read in English (the default), so the two keep separate caches. */
const LANG = 'es-ES'
const MIN = 60_000
const YEAR_DAYS = 366

let clock = FAKE_NOW
let hits: FakeHits

const daysAgo = (g: FakeGame) => (FAKE_NOW - Date.parse(g.lastTrophyAt!)) / 86_400_000
const started = (lib: FakeGame[]) => lib.filter((g) => g.earned > 0)
const within = (lib: FakeGame[], days: number) => started(lib).filter((g) => daysAgo(g) <= days)
/** Games whose completion date needs their trophies (psnCompletion.needsBaseTrophies). */
const eligible = (lib: FakeGame[]) => lib.filter((g) => g.hasDlc && (g.earned === 3 || (g.earned > 0 && g.platinum)))

/** The home's reads, as the page fires them together: summary, library, latest, 60 days, the year (header streak). */
const home = () =>
  Promise.all([
    psnSummary(ACCOUNT, USER),
    psnTitlesWithCompletion(ACCOUNT, USER),
    psnLatestTrophies(ACCOUNT, USER, LANG),
    psnRecentTrophies(ACCOUNT, 60, USER, LANG),
    psnRecentTrophies(ACCOUNT, YEAR_DAYS, USER, LANG),
  ])

/** What /api/psn/trophies does for one game. */
async function openGame(g: FakeGame) {
  const game = (await findPsnGame(ACCOUNT, g.titleId, USER))!
  await Promise.all([psnGameGroups(ACCOUNT, game, USER, LANG), psnGameTrophies(ACCOUNT, game, USER, LANG)])
}

/** The score fill's reads (scoreRefresh's psnPlan): every game with a trophy, 2 at a time, in the default language. */
async function scoreFill() {
  const games = (await psnTitles(ACCOUNT, USER)).filter((g) => g.numAwarded > 0)
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
  const playedPages = Math.ceil(lib.filter((g) => g.playedId).length / 200)
  const setBatches = Math.ceil(lib.filter((g) => g.playedId).length / 5)
  const titlePages = Math.ceil(count / 800)
  const year = within(lib, YEAR_DAYS)
  const sixty = within(lib, 60)

  beforeEach(() => setUp(lib))

  test('linking it', async () => {
    const link = await measure(async () => {
      const found = await findPsnAccount('player')
      await psnSummary(found!.accountId, USER)
    })
    expect(link).toEqual({ search: 1, summary: 1, titleCount: 1, profile: 1 })
  })

  test('the first visit, cold, step by step and all at once', async () => {
    const steps: [string, PsnCallCounts][] = []
    steps.push(['summary', await measure(() => psnSummary(ACCOUNT, USER))])
    steps.push(['library: titles, played, sets', await measure(() => psnTitles(ACCOUNT, USER))])
    steps.push(['library: completion dates', await measure(() => psnTitlesWithCompletion(ACCOUNT, USER))])
    steps.push(['latest trophies (3 games)', await measure(() => psnLatestTrophies(ACCOUNT, USER, LANG))])
    steps.push(['last 60 days', await measure(() => psnRecentTrophies(ACCOUNT, 60, USER, LANG))])
    steps.push(['last year (the streak)', await measure(() => psnRecentTrophies(ACCOUNT, YEAR_DAYS, USER, LANG))])
    steps.push(['score fill (every game, English)', await measure(scoreFill)])
    note(`${count} games, cold, one read after another`, steps)

    const [summary, library, completion, latest, sixtyDays, yearStep, score] = steps.map(([, c]) => c)
    expect(summary).toEqual({ summary: 1, titleCount: 1, profile: 1 })
    expect(library).toEqual({ titles: titlePages, played: playedPages, sets: setBatches })
    expect(completion).toEqual({ gameTrophies: 2 * eligible(lib).length })
    expect(latest).toEqual({ gameTrophies: 6 })
    expect(sixtyDays.gameTrophies).toBe(2 * (sixty.length - 3))
    expect(yearStep.gameTrophies).toBe(2 * (year.length - sixty.length))
    expect(score.gameTrophies).toBe(2 * (started(lib).length - eligible(lib).length))

    // The same reads fired together share what is in flight: the total does not change.
    await setUp(lib)
    const cold = await measure(home)
    note(`${count} games, cold, the home's reads together`, [['home', cold]])
    expect(cold.gameTrophies).toBe(2 * (eligible(lib).length + year.length))
    expect(total(cold)).toBe(total(summary) + total(library) + total(completion) + total(latest) + total(sixtyDays) + total(yearStep))
  })

  test('a refresh after 15 minutes, and with one new trophy', async () => {
    await home()
    clock += 15 * MIN + 1000
    const same = await measure(home)
    const base = { summary: 1, titleCount: 1, profile: 1, titles: titlePages, played: playedPages }
    expect(same).toEqual(base)

    const game = year.find((g) => !eligible(lib).includes(g))!
    game.lastTrophyAt = new Date(clock).toISOString()
    clock += 15 * MIN + 1000
    const moved = await measure(home)
    expect(moved).toEqual({ ...base, gameTrophies: 2 })
    note(`${count} games, refreshed after 15 minutes`, [['nothing new', same], ['one game with a new trophy', moved]])
  })

  test('a navigation: home, a game, another, the library, cache warm', async () => {
    await home()
    const inYear = year.find((g) => daysAgo(g) > 60)!
    const old = started(lib).find((g) => daysAgo(g) > YEAR_DAYS && !eligible(lib).includes(g))!
    const nav = {
      home: await measure(home),
      'a game from this year': await measure(() => openGame(inYear)),
      'a game older than a year': await measure(() => openGame(old)),
      library: await measure(() => psnTitlesWithCompletion(ACCOUNT, USER)),
    }
    note(`${count} games, navigating with a warm cache`, Object.entries(nav))
    expect(nav.home).toEqual({})
    expect(nav['a game from this year']).toEqual({ gameGroups: 2 })
    expect(nav['a game older than a year']).toEqual({ gameGroups: 2, gameTrophies: 2 })
    expect(nav.library).toEqual({})
  })
})
