import { STREAK_TIERS, streakInk, streakTier } from './streakTier'

test('the tiers start at 0, 5, 10, 20, 30, 40 and 50 days', () => {
  expect(STREAK_TIERS.map((t) => t.from)).toEqual([0, 5, 10, 20, 30, 40, 50])
})

test.each([
  [0, 'none'], [4, 'none'], [5, 'spark'], [9, 'spark'], [10, 'steady'], [19, 'steady'],
  [20, 'glow'], [29, 'glow'], [30, 'blaze'], [39, 'blaze'], [40, 'inferno'], [49, 'inferno'], [50, 'legend'], [400, 'legend'],
])('%i days is %s', (days, id) => {
  expect(streakTier(days).id).toBe(id)
})

test('every tier has its own hue', () => {
  expect(new Set(STREAK_TIERS.map((t) => t.color)).size).toBe(STREAK_TIERS.length)
})

test('the ink mixes the hue with the theme text colour', () => {
  expect(streakInk(streakTier(5))).toContain('56 189 248')
  expect(streakInk(streakTier(5))).toContain('--text-main')
})
