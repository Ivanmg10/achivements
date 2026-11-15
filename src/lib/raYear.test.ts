jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getAchievementsEarnedBetween: jest.fn() }))

import { slimUnlock } from './raYear'

test('leaves out the fields no page reads, and keeps everything else', () => {
  const unlock = {
    Date: '2026-11-01 10:00:00', Title: 'Win', Author: 'someone', Type: 'win_condition',
    AuthorULID: '01H…', BadgeURL: '/Badge/1.png', GameURL: '/game/1', CumulScore: 120,
  }
  expect(slimUnlock(unlock)).toEqual({ Date: '2026-11-01 10:00:00', Title: 'Win', Author: 'someone', Type: 'win_condition' })
  // A copy: the cached unlock keeps its fields.
  expect(unlock.BadgeURL).toBe('/Badge/1.png')
})

test('anything that is not an object passes through', () => {
  expect(slimUnlock(null)).toBeNull()
  expect(slimUnlock(3)).toBe(3)
})
