import { buildShelves, countBySource, entryCounts, entryHref, entryId, entryTotal, filterEntries, lastPlayedAgo, SHELF_CAP } from './libraryShelves'
import type { LibraryEntry } from './libraryInsights'

const NOW = Date.parse('2026-10-11T12:00:00Z')
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

let n = 0
function steam(title: string, pct: number | null, last: number | null, extra: object = {}): LibraryEntry {
  const id = ++n
  return { kind: 'steam', key: `steam:${id}`, title, pct, lastPlayed: last === null ? null : daysAgo(last), game: { id, maxPossible: 20, ...extra } } as unknown as LibraryEntry
}
const ids = (list: LibraryEntry[]) => list.map((e) => e.title)
const shelves = (list: LibraryEntry[], cat: string) => Object.fromEntries(buildShelves(list, cat, NOW).map((s) => [s.id, ids(s.entries)]))

describe('buildShelves, in progress', () => {
  const list = [
    steam('today', 30, 0), steam('last-week', 90, 6), steam('almost-old', 85, 200), steam('almost-new', 88, 20),
    steam('stalled', 10, 150), steam('plain', 40, 30), steam('undated', 20, null),
  ]
  const s = shelves(list, 'playing')

  test('continue holds what was played this week, latest first', () => {
    expect(s.continue).toEqual(['today', 'last-week'])
  })
  test('a game sits on one shelf only: the first that claims it', () => {
    // last-week is 90% and recent: it is on continue, not on almost.
    expect(s.almost).toEqual(['almost-new', 'almost-old'])
    // almost-old is also stalled, but almost came first.
    expect(s.stalled).toEqual(['stalled'])
  })
  test('the rest is everything left, latest first, undated last', () => {
    expect(s.rest).toEqual(['plain', 'undated'])
  })
  test('shelf order, size and the filter "see all" opens with', () => {
    const built = buildShelves(list, 'playing', NOW)
    expect(built.map((b) => b.id)).toEqual(['continue', 'almost', 'stalled', 'rest'])
    expect(built.map((b) => b.cap)).toEqual([SHELF_CAP, SHELF_CAP, SHELF_CAP, SHELF_CAP])
    expect(built.map((b) => b.quick)).toEqual(['all', 'almost', 'stalled', 'all'])
  })
  test('empty shelves are left out', () => {
    expect(buildShelves([steam('only', 40, 30)], 'playing', NOW).map((b) => b.id)).toEqual(['rest'])
    expect(buildShelves([], 'playing', NOW)).toEqual([])
  })
})

test('completed: the latest nine on show, the rest as earlier ones', () => {
  const list = Array.from({ length: 11 }, (_, d) => steam(`c${d}`, 100, d * 40))
  const s = shelves(list, 'completed')
  expect(s.recent).toEqual(['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'])
  expect(s.older).toEqual(['c9', 'c10'])
})

test('want to play: the shortest games first, the rest by name', () => {
  const list = [steam('b-long', null, null, { maxPossible: 80 }), steam('a-mid', null, null, { maxPossible: 30 }), steam('z-short', null, null, { maxPossible: 5 })]
  const s = shelves(list, 'wantToPlay')
  expect(s.start).toEqual(['z-short', 'a-mid', 'b-long'])
  expect(s.backlog).toBeUndefined()
  const many = Array.from({ length: 11 }, (_, i) => steam(`g${i}`, null, null, { maxPossible: 10 + i }))
  expect(shelves(many, 'wantToPlay').backlog).toEqual(['g10', 'g9'])
})

describe('entries of any platform', () => {
  const ra = { kind: 'ra', key: 'ra:5', title: 'Sonic', pct: 50, lastPlayed: null, game: { GameID: 5, MaxPossible: 24 } } as unknown as LibraryEntry
  const raWant = { kind: 'ra', key: 'ra:6', title: 'Zelda', pct: null, lastPlayed: null, game: { ID: 6, AchievementsPublished: 40 } } as unknown as LibraryEntry
  const psn = { kind: 'psn', key: 'psn:2018800', title: 'Astro', pct: 10, lastPlayed: null, game: { id: 2018800, maxPossible: 36 } } as unknown as LibraryEntry

  test('id, link and size', () => {
    expect([entryId(ra), entryId(raWant), entryId(psn)]).toEqual([5, 6, 2018800])
    expect(entryHref(ra)).toBe('/gameInfo/5')
    expect(entryHref(psn)).toContain('/psnGame/')
    expect([entryTotal(ra), entryTotal(raWant), entryTotal(psn)]).toEqual([24, 40, 36])
  })
  test('counts by platform', () => {
    expect(countBySource([ra, raWant, psn, steam('s', 1, 1)])).toEqual({ ra: 2, steam: 1, psn: 1 })
  })
})

describe('filterEntries', () => {
  const list = [steam('Pokémon Red', 50, 1), { ...steam('Hades', 90, 1), kind: 'psn' } as LibraryEntry, steam('Celeste', 85, 200)]
  const all = { query: '', source: 'all' as const, quick: 'all' as const }
  test('without filters it keeps everything', () => expect(filterEntries(list, all, NOW)).toHaveLength(3))
  test('the title ignores case and accents', () => expect(ids(filterEntries(list, { ...all, query: 'pokemon' }, NOW))).toEqual(['Pokémon Red']))
  test('the platform chip', () => expect(ids(filterEntries(list, { ...all, source: 'psn' }, NOW))).toEqual(['Hades']))
  test('the quick filter', () => expect(ids(filterEntries(list, { ...all, quick: 'almost' }, NOW))).toEqual(['Hades', 'Celeste']))
  test('all together', () => expect(filterEntries(list, { query: 'cel', source: 'steam', quick: 'stalled' }, NOW)).toHaveLength(1))
})

describe('entryCounts', () => {
  test('earned of total, as each platform counts it', () => {
    expect(entryCounts({ kind: 'ra', game: { NumAwarded: 3, MaxPossible: 10 } } as unknown as LibraryEntry)).toEqual({ earned: 3, total: 10 })
    expect(entryCounts({ kind: 'steam', game: { numAwarded: 5, maxPossible: 20 } } as unknown as LibraryEntry)).toEqual({ earned: 5, total: 20 })
  })
  test('none for a game not started, or with no achievements', () => {
    expect(entryCounts({ kind: 'ra', game: { ID: 6, AchievementsPublished: 40 } } as unknown as LibraryEntry)).toBeNull()
    expect(entryCounts({ kind: 'psn', game: { numAwarded: 0, maxPossible: 0 } } as unknown as LibraryEntry)).toBeNull()
  })
})

describe('lastPlayedAgo', () => {
  test('today and yesterday in words, then days, months and years', () => {
    expect(lastPlayedAgo(daysAgo(0), 'en', NOW)).toBe('today')
    expect(lastPlayedAgo(daysAgo(1), 'en', NOW)).toBe('yesterday')
    expect(lastPlayedAgo(daysAgo(12), 'en', NOW)).toBe('12 days ago')
    expect(lastPlayedAgo(daysAgo(95), 'en', NOW)).toBe('3 months ago')
    expect(lastPlayedAgo(daysAgo(800), 'en', NOW)).toBe('2 years ago')
  })
  test('in the language asked for', () => {
    expect(lastPlayedAgo(daysAgo(1), 'es', NOW)).toBe('ayer')
  })
  test('empty when it is unknown or not a date, and never in the future', () => {
    expect(lastPlayedAgo(null, 'en', NOW)).toBe('')
    expect(lastPlayedAgo('nope', 'en', NOW)).toBe('')
    expect(lastPlayedAgo(new Date(NOW + 5 * 86_400_000).toISOString(), 'en', NOW)).toBe('today')
  })
})
