import { countBySource, entryHref, entryId, filterEntries } from './libraryEntries'
import type { LibraryEntry } from './libraryInsights'

const NOW = Date.parse('2026-10-11T12:00:00Z')
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

let n = 0
function steam(title: string, pct: number | null, last: number | null, extra: object = {}): LibraryEntry {
  const id = ++n
  return { kind: 'steam', key: `steam:${id}`, title, pct, lastPlayed: last === null ? null : daysAgo(last), game: { id, maxPossible: 20, ...extra } } as unknown as LibraryEntry
}
const ids = (list: LibraryEntry[]) => list.map((e) => e.title)

describe('entries of any platform', () => {
  const ra = { kind: 'ra', key: 'ra:5', title: 'Sonic', pct: 50, lastPlayed: null, game: { GameID: 5, MaxPossible: 24 } } as unknown as LibraryEntry
  const raWant = { kind: 'ra', key: 'ra:6', title: 'Zelda', pct: null, lastPlayed: null, game: { ID: 6, AchievementsPublished: 40 } } as unknown as LibraryEntry
  const psn = { kind: 'psn', key: 'psn:2018800', title: 'Astro', pct: 10, lastPlayed: null, game: { id: 2018800, maxPossible: 36 } } as unknown as LibraryEntry

  test('id and link', () => {
    expect([entryId(ra), entryId(raWant), entryId(psn)]).toEqual([5, 6, 2018800])
    expect(entryHref(ra)).toBe('/gameInfo/5')
    expect(entryHref(psn)).toContain('/psnGame/')
  })
  test('counts by platform', () => {
    expect(countBySource([ra, raWant, psn, steam('s', 1, 1)])).toEqual({ ra: 2, steam: 1, psn: 1, xbox: 0 })
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
