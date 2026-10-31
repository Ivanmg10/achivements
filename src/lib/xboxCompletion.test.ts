import { withXboxCompletionDates } from './xboxCompletion'
import { xboxAchievementFixture, xboxGameFixture } from '@/test-utils/xboxFixtures'

test('enriches only completed games and dates them from the latest unlocked achievement', async () => {
  const completed = xboxGameFixture({ pctWon: 100, lastPlayed: '2026-10-01T00:00:00Z' })
  const incomplete = xboxGameFixture({ id: 2, pctWon: 50 })
  const load = jest.fn(async () => [
    xboxAchievementFixture({ unlockedAt: '2021-01-01T00:00:00Z' }),
    xboxAchievementFixture({ id: '2', unlockedAt: '2026-04-01T00:00:00Z' }),
  ])

  const games = await withXboxCompletionDates([completed, incomplete], load)
  expect(games[0].completedAt).toBe('2026-04-01T00:00:00Z')
  expect(games[0].lastPlayed).toBe('2026-10-01T00:00:00Z')
  expect(games[1].completedAt).toBeUndefined()
  expect(load).toHaveBeenCalledTimes(1)
})

test('a failed achievement read leaves only that completion date unknown', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const completed = xboxGameFixture({ pctWon: 100 })
  const games = await withXboxCompletionDates([completed], jest.fn().mockRejectedValue(new Error('rate limited')))
  expect(games[0].completedAt).toBeNull()
})
