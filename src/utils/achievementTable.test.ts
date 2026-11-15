import { anchorOf, earnedRing, sortEntries } from './achievementTable'
import type { CompareAchievement } from './gameCompare'

const entry = (order: number, row: Partial<CompareAchievement>) => ({
  item: null,
  order,
  row: { id: String(order), title: '', description: '', iconUrl: null, rarity: null, earned: false, earnedAt: null, ...row },
})
const ids = (list: { row: { id: string } }[]) => list.map((e) => e.row.id)

const LIST = [
  entry(0, { rarity: 50, earned: true, earnedAt: '2026-01-02' }),
  entry(1, { rarity: null }),
  entry(2, { rarity: 5, earned: true, earnedAt: '2026-01-05' }),
  entry(3, { rarity: 20 }),
]

test('game order, either way', () => {
  expect(ids(sortEntries(LIST, { key: 'default', dir: 'asc' }))).toEqual(['0', '1', '2', '3'])
  expect(ids(sortEntries(LIST, { key: 'default', dir: 'desc' }))).toEqual(['3', '2', '1', '0'])
})

test('rarest first, an unknown rarity after the known ones, in both directions', () => {
  expect(ids(sortEntries(LIST, { key: 'rarity', dir: 'asc' }))).toEqual(['2', '3', '0', '1'])
  expect(ids(sortEntries(LIST, { key: 'rarity', dir: 'desc' }))).toEqual(['0', '3', '2', '1'])
})

test('by unlock: newest first, the locked ones last either way', () => {
  expect(ids(sortEntries(LIST, { key: 'earned', dir: 'desc' }))).toEqual(['2', '0', '1', '3'])
  expect(ids(sortEntries(LIST, { key: 'earned', dir: 'asc' }))).toEqual(['0', '2', '1', '3'])
})

test('any other key by its value, smallest first', () => {
  const points = [4, 1, 9, 2]
  expect(ids(sortEntries(LIST, { key: 'points', dir: 'desc' }, (e) => points[e.order]))).toEqual(['2', '0', '3', '1'])
})

test("an earned badge's ring: its grade on PSN, the mode on RA, the accent elsewhere", () => {
  expect(earnedRing(entry(0, { grade: 'platinum' }).row)).toBe('ring-platinum')
  expect(earnedRing(entry(0, { hardcore: true }).row)).toBe('ring-hardcore')
  expect(earnedRing(entry(0, { hardcore: false }).row)).toBe('ring-softcore')
  expect(earnedRing(entry(0, {}).row)).toBe('ring-accent')
})

test('the anchor a fragment names, decoded, and nothing for one that cannot be read', () => {
  expect(anchorOf('#ach-ÑAME%20X')).toBe('ach-ÑAME X')
  expect(anchorOf('#trophy-3')).toBe('trophy-3')
  expect(anchorOf('')).toBe('')
  expect(anchorOf('#ach-%E0')).toBe('')
})
