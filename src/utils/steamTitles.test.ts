import { steamAchievementAnchor } from './steamTitles'

test('an achievement anchor is its api name after the prefix, whatever characters it holds', () => {
  expect(steamAchievementAnchor('WIN')).toBe('ach-WIN')
  expect(steamAchievementAnchor('ÑAME X')).toBe('ach-ÑAME X')
})
