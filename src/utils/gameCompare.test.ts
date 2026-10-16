import type { RetroAchievementsGameWithAchievements } from '@/types/types'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import {
  compareSummary,
  filterCompare,
  firstToUnlock,
  formatUnlockDate,
  mergeCompare,
  psnCompareList,
  raCompareList,
  steamCompareList,
  type CompareAchievement,
} from './gameCompare'

const ach = (id: string, earned: boolean, earnedAt: string | null = null): CompareAchievement => ({
  id, title: id, description: '', iconUrl: null, rarity: null, earned, earnedAt,
})

describe('raCompareList', () => {
  const game = {
    NumDistinctPlayers: 200,
    Achievements: {
      2: { ID: 2, Title: 'B', Description: 'b', BadgeName: '222', Points: 10, NumAwarded: 50, DisplayOrder: 2, DateEarned: '2026-01-02 10:00:00' },
      1: { ID: 1, Title: 'A', Description: 'a', BadgeName: '111', Points: 5, NumAwarded: 300, DisplayOrder: 1, DateEarned: '2026-01-01 10:00:00', DateEarnedHardcore: '2026-01-01 09:00:00' },
      3: { ID: 3, Title: 'C', Description: 'c', BadgeName: '', Points: 25, NumAwarded: 0, DisplayOrder: 3 },
    },
  } as unknown as RetroAchievementsGameWithAchievements

  test("in RA's order, with points, rarity and the hardcore date first", () => {
    const list = raCompareList(game)
    expect(list.map((a) => a.id)).toEqual(['1', '2', '3'])
    expect(list[0]).toMatchObject({ earned: true, earnedAt: '2026-01-01 09:00:00', hardcore: true, points: 5, rarity: 100 })
    expect(list[1]).toMatchObject({ earned: true, hardcore: false, rarity: 25, iconUrl: 'https://media.retroachievements.org/Badge/222.png' })
    expect(list[2]).toMatchObject({ earned: false, earnedAt: null, iconUrl: null })
  })

  test('no game, no list; no players, no rarity', () => {
    expect(raCompareList(null)).toEqual([])
    expect(raCompareList({ ...game, NumDistinctPlayers: 0 })[0].rarity).toBeNull()
  })
})

test('Steam achievements keep their order, rarity and anchor', () => {
  const list = steamCompareList([
    { apiname: 'B', title: 'b', description: '', badgeUrl: 'u', displayOrder: 2, earned: false, dateEarned: null, globalPct: 3 },
    { apiname: 'A', title: 'a', description: '', badgeUrl: '', displayOrder: 1, earned: true, dateEarned: null, globalPct: null },
  ] as unknown as SteamAchievementUnified[])
  expect(list.map((a) => a.id)).toEqual(['A', 'B'])
  // Unlocked before Steam kept dates: earned with no date.
  expect(list[0]).toMatchObject({ earned: true, earnedAt: null, iconUrl: null, anchor: 'ach-A' })
  expect(list[1]).toMatchObject({ rarity: 3, iconUrl: 'u' })
})

test('PSN trophies carry their grade and anchor', () => {
  const [t] = psnCompareList([
    { id: 4, name: 'Plat', detail: 'd', iconUrl: 'i', type: 'platinum', groupId: 'default', hidden: false, earned: true, earnedAt: '2026-02-01T00:00:00Z', rarity: 1.5 },
  ] as PsnTrophy[])
  expect(t).toMatchObject({ id: '4', grade: 'platinum', rarity: 1.5, anchor: 'trophy-4', earned: true })
})

describe('comparing', () => {
  const theirs = [ach('a', true, '2026-01-01'), ach('b', true, '2026-01-05'), ach('c', false), ach('d', false)]
  const mine = [ach('a', true, '2026-01-03'), ach('c', true, '2026-01-04')]
  const rows = mergeCompare(theirs, mine)

  test("puts the viewer's unlock beside theirs, and none at all when not comparing", () => {
    expect(rows.map((r) => r.mine?.earned)).toEqual([true, false, true, false])
    expect(mergeCompare(theirs, null).every((r) => r.mine === null)).toBe(true)
  })

  test('filters by who has it', () => {
    expect(filterCompare(rows, 'both').map((r) => r.id)).toEqual(['a'])
    expect(filterCompare(rows, 'onlyThem').map((r) => r.id)).toEqual(['b'])
    expect(filterCompare(rows, 'onlyMe').map((r) => r.id)).toEqual(['c'])
    expect(filterCompare(rows, 'neither').map((r) => r.id)).toEqual(['d'])
    expect(filterCompare(rows, 'all')).toHaveLength(4)
  })

  test('sums it up', () => {
    expect(compareSummary(rows)).toEqual({ all: 4, both: 1, onlyThem: 1, onlyMe: 1, neither: 1, theirs: 2, mine: 2 })
  })

  test('says who got it first, only when both did and both dates are known', () => {
    expect(firstToUnlock(rows[0])).toBe('them')
    expect(firstToUnlock({ ...rows[0], earnedAt: '2026-02-01' })).toBe('me')
    expect(firstToUnlock({ ...rows[0], earnedAt: '2026-01-03' })).toBeNull()
    expect(firstToUnlock({ ...rows[0], earnedAt: null })).toBeNull()
    expect(firstToUnlock(rows[1])).toBeNull()
    expect(firstToUnlock({ ...rows[0], earnedAt: 'not a date' })).toBeNull()
  })
})

test('an unlock date reads in the given language, and nothing when there is none', () => {
  expect(formatUnlockDate('2026-10-03 12:00:00', 'en-GB')).toBe('3 Oct 2026')
  expect(formatUnlockDate(null, 'en')).toBeNull()
  expect(formatUnlockDate('garbage', 'en')).toBeNull()
})

describe('xboxCompareList', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { xboxCompareList } = require('./gameCompare') as typeof import('./gameCompare')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { xboxAchievementFixture } = require('@/test-utils/xboxFixtures') as typeof import('@/test-utils/xboxFixtures')

  test('maps an Xbox achievement: gamerscore, rarity, its anchor and when it was earned', () => {
    expect(xboxCompareList([xboxAchievementFixture({ id: '7', name: 'Seven', gamerscore: 25, rarity: 3.2 })])).toEqual([
      {
        id: '7', title: 'Seven', description: 'Complete the Prologue', iconUrl: null, gamerscore: 25, rarity: 3.2,
        anchor: 'achievement-7', earned: true, earnedAt: '2026-01-06T18:20:22.7030000Z',
      },
    ])
  })

  test('keeps Xbox'+"'"+'s own order', () => {
    const list = xboxCompareList([xboxAchievementFixture({ id: '2' }), xboxAchievementFixture({ id: '1' })])
    expect(list.map((a) => a.id)).toEqual(['2', '1'])
  })
})
