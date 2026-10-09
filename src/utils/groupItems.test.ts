import { filterGroupItems, getDecade, groupSummary, itemKey, liveProgressMap, raProgressMaps } from './groupItems'
import type { GameGroupItem } from '@/types/types'

const item = (over: Partial<GameGroupItem>): GameGroupItem => ({
  id: 1,
  game_id: 1,
  title: 'G',
  image_icon: null,
  console_name: 'SNES',
  pct_won: '0',
  num_awarded: 0,
  max_possible: 10,
  points_won: 0,
  max_points: 0,
  position: 0,
  added_at: '2026-01-01',
  ...over,
})

test('an item without a source is an RA game', () => {
  expect(itemKey(item({ game_id: 620 }))).toBe('ra:620')
  expect(itemKey(item({ game_id: 620, source: 'steam' }))).toBe('steam:620')
})

test('decades', () => {
  expect([1985, 1998, 2004, 2015, 2023].map(getDecade)).toEqual(['80s', '90s', '00s', '10s', '20s'])
})

test('filters by console, progress (Steam live) and decade (unknown years left out)', () => {
  const items = [
    item({ id: 1, pct_won: '0', release_year: 1998 }),
    item({ id: 2, pct_won: '0.5', release_year: 2004, console_name: 'PS2' }),
    item({ id: 3, source: 'steam', game_id: 9, pct_won: '0', release_year: 2015, console_name: 'Steam' }),
    item({ id: 4, pct_won: '1', release_year: 0 }),
  ]
  const live = liveProgressMap([{ id: 9, achievementsLoaded: true, maxPossible: 4, numAwarded: 4 } as never])
  const ids = (f: Partial<Parameters<typeof filterGroupItems>[1]>) =>
    filterGroupItems(items, { consoles: new Set(), pct: 'all', decade: 'all', ...f }, live).map((i) => i.id)
  expect(ids({ consoles: new Set(['PS2']) })).toEqual([2])
  expect(ids({ pct: '100' })).toEqual([3, 4])
  expect(ids({ pct: '0' })).toEqual([1])
  expect(ids({ decade: '10s' })).toEqual([3])
  expect(ids({ decade: '80s' })).toEqual([])
})

test('RA progress keeps the best number per mode across both sources', () => {
  const { ach, pts, lastPlayed } = raProgressMaps(
    [
      {
        GameID: 1,
        NumPossibleAchievements: 10,
        NumAchievedHardcore: 3,
        NumAchieved: 5,
        ScoreAchievedHardcore: 30,
        ScoreAchieved: 50,
        PossibleScore: 100,
        LastPlayed: '2026-09-01',
      } as never,
    ],
    [{ GameID: 1, MaxPossible: 10, NumAwarded: 6, HardcoreMode: '1' } as never],
  )
  expect(ach.get(1)).toEqual({ scEarned: 5, hcEarned: 6, total: 10 })
  expect(pts.get(1)).toEqual({ earned: 30, total: 100 })
  expect(lastPlayed.get(1)).toBe('2026-09-01')
})

test('the group summary takes live numbers where there are any, stored ones otherwise', () => {
  const items = [
    item({ id: 1, game_id: 1 }),
    item({ id: 2, game_id: 2, num_awarded: 2, max_possible: 8 }),
    item({ id: 3, source: 'steam', game_id: 9 }),
  ]
  const ra = new Map([[1, { scEarned: 4, hcEarned: 6, total: 10 }]])
  const live = new Map([['steam:9', { earned: 1, total: 5, pct: 0.2 }]])
  expect(groupSummary(items, ra, live)).toEqual({ earned: 6 + 2 + 1, total: 10 + 8 + 5 })
})

test('PSN progress is live too, and never read from a Steam app with the same number', () => {
  const items = [
    item({ id: 1, source: 'psn', game_id: 620, pct_won: '0', num_awarded: 0, max_possible: 10 }),
    item({ id: 2, source: 'steam', game_id: 620, pct_won: '0', num_awarded: 0, max_possible: 10 }),
  ]
  const live = liveProgressMap(
    [{ id: 620, achievementsLoaded: true, maxPossible: 50, numAwarded: 50 } as never],
    [{ id: 620, maxPossible: 10, numAwarded: 4, pctWon: 30 } as never],
  )
  expect(groupSummary(items, new Map(), live)).toEqual({ earned: 4 + 50, total: 10 + 50 })
  // Sony's own percentage, which weighs trophies by grade.
  const ids = (pct: '100' | 'progress') =>
    filterGroupItems(items, { consoles: new Set(), pct, decade: 'all' }, live).map((i) => i.id)
  expect(ids('progress')).toEqual([1])
  expect(ids('100')).toEqual([2])
})
