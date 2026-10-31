import { withPsnCompletionDates } from './psnCompletion'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import type { PsnTrophy } from '@/types/psn'

const psnTrophyFixture = (overrides: Partial<PsnTrophy>): PsnTrophy => ({
  id: 1, name: '', detail: '', iconUrl: null, type: 'bronze', groupId: 'default', hidden: false, earned: true, earnedAt: null, rarity: null, ...overrides,
})

test('enriches only completed games with DLC and preserves the platinum date on a later sync', async () => {
  const noDlc = psnGameFixture({ id: 1, hasDlc: false, pctWon: 100, lastTrophyAt: '2020-01-01T00:00:00Z' })
  const dlc = psnGameFixture({ id: 2, hasDlc: true, pctWon: 100, lastTrophyAt: '2026-01-01T00:00:00Z' })
  const incomplete = psnGameFixture({ id: 3, hasDlc: true, pctWon: 50, earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 } })
  const load = jest.fn(async () => [
    psnTrophyFixture({ type: 'platinum', groupId: 'default', earnedAt: '2021-05-10T00:00:00Z' }),
    psnTrophyFixture({ id: 2, groupId: '001', earnedAt: '2026-01-01T00:00:00Z' }),
  ])

  const games = await withPsnCompletionDates([noDlc, dlc, incomplete], load)
  expect(games[0].completedAt).toBe('2020-01-01T00:00:00Z')
  expect(games[1].completedAt).toBe('2021-05-10T00:00:00Z')
  expect(games[1].lastTrophyAt).toBe('2026-01-01T00:00:00Z')
  expect(games[2].completedAt).toBeUndefined()
  expect(load).toHaveBeenCalledTimes(1)
})

test('a failed completion lookup leaves only that date unknown and does not fail the library', async () => {
  const dlc = psnGameFixture({ id: 2, hasDlc: true, pctWon: 100, earned: { bronze: 0, silver: 0, gold: 0, platinum: 1 } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const games = await withPsnCompletionDates([dlc], jest.fn().mockRejectedValue(new Error('PSN busy')))
  expect(games).toHaveLength(1)
  expect(games[0].completedAt).toBeNull()
})
