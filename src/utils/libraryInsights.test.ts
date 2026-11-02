import { buildEntries, countQuick, matchesQuick, mixedSortKeys, sortEntries, type LibraryEntry } from './libraryInsights'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'

const NOW = Date.parse('2026-10-11T12:00:00Z')
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

describe('matchesQuick', () => {
  test('all matches anything', () => {
    expect(matchesQuick({ pct: null, lastPlayed: null }, 'all', NOW)).toBe(true)
  })
  test('almost is 80% up to, not including, 100%', () => {
    const p = (pct: number | null) => matchesQuick({ pct, lastPlayed: null }, 'almost', NOW)
    expect([p(79), p(80), p(99), p(100), p(null)]).toEqual([false, true, true, false, false])
  })
  test('stalled needs a known date older than 90 days', () => {
    const s = (lastPlayed: string | null) => matchesQuick({ pct: 10, lastPlayed }, 'stalled', NOW)
    expect([s(daysAgo(89)), s(daysAgo(91)), s(null), s('not a date')]).toEqual([false, true, false, false])
  })
  test('reads RA\'s local "YYYY-MM-DD HH:mm:ss" dates', () => {
    expect(matchesQuick({ pct: 10, lastPlayed: '2020-01-15 20:30:00' }, 'stalled', NOW)).toBe(true)
  })
})

test('countQuick counts each filter', () => {
  const items = [
    { pct: 90, lastPlayed: daysAgo(1) },
    { pct: 85, lastPlayed: daysAgo(200) },
    { pct: 10, lastPlayed: daysAgo(300) },
  ]
  expect(countQuick(items, NOW)).toEqual({ all: 3, almost: 2, stalled: 2 })
})

describe('mixed list', () => {
  const steam = { id: 1, title: 'Beta', pctWon: 50, lastPlayed: daysAgo(5) } as SteamGameProgress
  const psn = { id: 2, title: 'Alpha', pctWon: 90, lastPlayed: null, lastTrophyAt: daysAgo(1) } as PsnGameProgress
  const ra = [{ GameID: 3, Title: 'Gamma', PctWon: '0.25' }] as never
  const extra = new Map([[3, { awards: [], lastPlayed: daysAgo(30) }]])
  const entries = buildEntries(ra, extra, [steam], [psn])

  test('takes each platform\'s progress and date', () => {
    expect(entries.map((e) => [e.key, e.pct, e.lastPlayed === null])).toEqual([
      ['ra:3', 25, false],
      ['steam:1', 50, false],
      ['psn:2', 90, false],
    ])
  })
  test('sorts by name, progress and last played, in either direction', () => {
    const order = (key: 'name' | 'percent' | 'lastPlayed', dir: 'asc' | 'desc') =>
      sortEntries(entries, { key, dir }).map((e) => e.title)
    expect(order('name', 'asc')).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(order('percent', 'desc')).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(order('lastPlayed', 'desc')).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(order('lastPlayed', 'asc')).toEqual(['Gamma', 'Beta', 'Alpha'])
  })
})

describe('completed list', () => {
  const entry = (title: string, lastPlayed: string | null, completedAt: string | null) => ({ title, lastPlayed, completedAt, pct: 100 }) as LibraryEntry

  test('goes by when each game was completed: a DLC played today does not move a platinum from 2021', () => {
    const entries = [entry('Spider-Man', '2026-10-25', '2021-12-23'), entry('Undated', '2026-01-01', null), entry('Newer', '2024-01-01', '2024-05-25')]
    expect(sortEntries(entries, { key: 'completed', dir: 'desc' }).map((e) => e.title)).toEqual(['Newer', 'Spider-Man', 'Undated'])
    expect(sortEntries(entries, { key: 'completed', dir: 'asc' }).map((e) => e.title)).toEqual(['Spider-Man', 'Newer', 'Undated'])
  })

  test('only Completed offers that order', () => {
    expect(mixedSortKeys('completed')).toContain('completed')
    expect(mixedSortKeys('playing')).not.toContain('completed')
  })
})

describe('Xbox entries', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { buildEntries, xboxProgress } = require('./libraryInsights') as typeof import('./libraryInsights')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { xboxGameFixture } = require('@/test-utils/xboxFixtures') as typeof import('@/test-utils/xboxFixtures')

  test('progress is the gamerscore percentage and the last session', () => {
    expect(xboxProgress(xboxGameFixture({ pctWon: 40, lastPlayed: '2026-01-01T00:00:00Z' }))).toEqual({ pct: 40, lastPlayed: '2026-01-01T00:00:00Z' })
  })

  test('the mixed list takes Xbox games, keyed apart from the other platforms', () => {
    const entries = buildEntries([], new Map(), [], [], [xboxGameFixture({ id: 730, title: 'Halo' })])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ kind: 'xbox', key: 'xbox:730', title: 'Halo', pct: 14 })
  })
})
