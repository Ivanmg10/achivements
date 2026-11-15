import { needsBaseTrophies, withCompletion } from './psnCompletion'
import { psnGameFixture } from '@/test-utils/psnFixtures'

test('a complete game without DLC is dated by its last trophy; one with DLC by what is known; others untouched', () => {
  const noDlc = psnGameFixture({ id: 1, hasDlc: false, pctWon: 100, lastTrophyAt: '2020-01-01T00:00:00Z' })
  const dlc = psnGameFixture({ id: 2, hasDlc: true, pctWon: 100, lastTrophyAt: '2026-01-01T00:00:00Z' })
  const incomplete = psnGameFixture({ id: 3, hasDlc: true, pctWon: 50, earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 } })
  const known = jest.fn(() => '2021-05-10T00:00:00Z')

  const games = withCompletion([noDlc, dlc, incomplete], known)
  expect(games[0].completedAt).toBe('2020-01-01T00:00:00Z')
  expect(games[1].completedAt).toBe('2021-05-10T00:00:00Z')
  expect(games[1].lastTrophyAt).toBe('2026-01-01T00:00:00Z')
  expect(games[2].completedAt).toBeUndefined()
  expect(known).toHaveBeenCalledTimes(1)
})

test('a DLC game not read yet has no date (null), and the library is whole', () => {
  const dlc = psnGameFixture({ id: 2, hasDlc: true, pctWon: 100, earned: { bronze: 0, silver: 0, gold: 0, platinum: 1 } })
  expect(needsBaseTrophies(dlc)).toBe(true)
  expect(withCompletion([dlc], () => null)).toEqual([{ ...dlc, completedAt: null }])
})
