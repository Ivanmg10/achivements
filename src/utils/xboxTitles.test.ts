import {
  classifyXboxGame,
  isXboxTitleId,
  totalGamerscore,
  xboxAchievementAnchor,
  xboxBackdrop,
  xboxHasAchievements,
  xboxNumericId,
  xboxPlatformChip,
  xboxTitleId,
} from './xboxTitles'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

describe('xboxNumericId', () => {
  test('a title id is its own number, and goes back to its string', () => {
    expect(xboxNumericId('1738914043')).toBe(1738914043)
    expect(xboxTitleId(1738914043)).toBe('1738914043')
    expect(isXboxTitleId('1096157159')).toBe(true)
  })

  test('what is not a plain decimal number, or is past the INTEGER columns, is null', () => {
    for (const bad of ['', 'abc', '12a', '-5', '0', '1.5', '12345678901', '2147483648', '4294836177']) {
      expect(xboxNumericId(bad)).toBeNull()
      expect(isXboxTitleId(bad)).toBe(false)
    }
    expect(xboxNumericId('2147483647')).toBe(2147483647)
  })
})

test('a game is completed at 100 %, in progress with something earned, and otherwise waiting', () => {
  expect(classifyXboxGame({ pctWon: 100 })).toBe('completed')
  expect(classifyXboxGame({ pctWon: 14 })).toBe('playing')
  expect(classifyXboxGame({ pctWon: 0 })).toBe('wantToPlay')
})

test('a game has achievements when its gamerscore or its count says so', () => {
  expect(xboxHasAchievements({ totalGamerscore: 1345, maxPossible: 0 })).toBe(true)
  expect(xboxHasAchievements({ totalGamerscore: 0, maxPossible: 12 })).toBe(true)
  expect(xboxHasAchievements({ totalGamerscore: 0, maxPossible: 0 })).toBe(false)
})

test('an achievement has an anchor on its game page', () => {
  expect(xboxAchievementAnchor('49')).toBe('achievement-49')
})

test('the chip says the platform in words and picks its colours by the first one', () => {
  expect(xboxPlatformChip('Xbox Series · PC')).toContain('bg-zinc-100')
  expect(xboxPlatformChip('Xbox One')).toContain('bg-[#107c10]')
  expect(xboxPlatformChip('Xbox 360')).toContain('bg-black')
  expect(xboxPlatformChip('PC')).toContain('bg-sky-300')
})

test('the backdrop is the box art, the only art Xbox sends', () => {
  expect(xboxBackdrop({ imageIcon: 'https://x/a.png' })).toBe('https://x/a.png')
})

test('total gamerscore adds the library up', () => {
  expect(totalGamerscore([xboxGameFixture({ earnedGamerscore: 200 }), xboxGameFixture({ earnedGamerscore: 50 })])).toBe(250)
  expect(totalGamerscore([])).toBe(0)
})
