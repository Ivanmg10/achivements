import {
  sortByLastPlayed,
  toXbox360Achievement,
  toXboxAchievement,
  toXboxGame,
  toXboxProfile,
  xboxPlatforms,
} from './xboxMappers'
import { RAW_360_ACHIEVEMENT, RAW_360_TITLE, RAW_ACHIEVED, RAW_LOCKED, RAW_MODERN_TITLE, RAW_PROFILE, xboxGameFixture } from '@/test-utils/xboxFixtures'

describe('toXboxProfile', () => {
  test('reads the settings list, with the avatar over https and the score as a number', () => {
    expect(toXboxProfile(RAW_PROFILE)).toEqual({
      xuid: '2535400000000001',
      gamertag: 'TestPlayer',
      avatarUrl: 'https://images-eds-ssl.xboxlive.com/image?url=abc&format=png',
      bio: 'Plays everything',
      gamerscore: 10242,
      tier: 'Silver',
    })
  })

  test('no user, or one without a gamertag, is no profile', () => {
    expect(toXboxProfile(undefined)).toBeNull()
    expect(toXboxProfile({ id: '1', settings: [{ id: 'Gamerscore', value: '5' }] })).toBeNull()
  })

  test('a missing or unreadable score is 0, a missing bio is empty', () => {
    const p = toXboxProfile({ id: '1', settings: [{ id: 'Gamertag', value: 'A' }, { id: 'Gamerscore', value: 'x' }] })
    expect(p).toMatchObject({ gamerscore: 0, tier: '', avatarUrl: null, bio: '' })
  })
})

describe('toXboxGame', () => {
  test('a modern game: an achievement total of 0 is unknown, not zero, and PC is listed once', () => {
    expect(toXboxGame(RAW_MODERN_TITLE)).toEqual({
      _source: 'xbox',
      id: 1738914043,
      titleId: '1738914043',
      title: 'Modern Game',
      imageIcon: 'https://images-eds-ssl.xboxlive.com/image?url=modern',
      consoleName: 'Xbox Series · PC',
      platforms: ['Xbox Series', 'PC'],
      is360: false,
      maxPossible: 0,
      numAwarded: 15,
      totalKnown: false,
      earnedGamerscore: 200,
      totalGamerscore: 1345,
      pctWon: 14,
      lastPlayed: '2026-10-15T15:07:05.562Z',
      playtimeMinutes: null,
    })
  })

  test('the cover of an Xbox 360 game comes from the host that has a certificate', () => {
  expect(toXboxGame({ ...RAW_360_TITLE, displayImage: 'http://images-eds.xboxlive.com/image?url=x' })?.imageIcon).toBe('https://images-eds-ssl.xboxlive.com/image?url=x')
  expect(toXboxGame({ ...RAW_360_TITLE, displayImage: 'https://image.xboxlive.com/a.png' })?.imageIcon).toBe('https://image-ssl.xboxlive.com/a.png')
})

test('an Xbox 360 game is flagged, and keeps its real total', () => {
    expect(toXboxGame(RAW_360_TITLE)).toMatchObject({ is360: true, maxPossible: 50, totalKnown: true, imageIcon: '', platforms: ['Xbox 360'] })
  })

  test('a game also on a newer console is not an Xbox 360 game', () => {
    expect(toXboxGame({ ...RAW_360_TITLE, devices: ['Xbox360', 'XboxOne'] })?.is360).toBe(false)
  })

  test('a title with no achievement block has none: its total of 0 is real, and "never played" is no date', () => {
    expect(toXboxGame({ titleId: '5', name: 'Bare', achievement: null, titleHistory: { lastTimePlayed: '0001-01-01T00:00:00Z' } })).toMatchObject({
      numAwarded: 0, maxPossible: 0, totalKnown: true, earnedGamerscore: 0, totalGamerscore: 0, pctWon: 0, lastPlayed: null,
    })
  })

  test('an id the app cannot key is no game', () => {
    expect(toXboxGame({ ...RAW_MODERN_TITLE, titleId: 'abc' })).toBeNull()
    expect(toXboxGame({ ...RAW_MODERN_TITLE, titleId: '4294836177' })).toBeNull()
    expect(toXboxGame({ ...RAW_MODERN_TITLE, titleId: '0' })).toBeNull()
  })
})

describe('toXboxAchievement', () => {
  test('an earned one: its date, score, icon, rarity and secrecy', () => {
    expect(toXboxAchievement(RAW_ACHIEVED)).toEqual({
      id: '1',
      name: 'Prologue',
      description: 'Complete the Prologue',
      iconUrl: 'https://images-eds-ssl.xboxlive.com/image?url=icon',
      gamerscore: 10,
      unlocked: true,
      unlockedAt: '2026-01-06T18:20:22.7030000Z',
      secret: true,
      rarity: 80.46,
      rarityCategory: 'Common',
    })
  })

  test('a locked one has no date, shows its locked text, and no rarity when Xbox sends none', () => {
    expect(toXboxAchievement(RAW_LOCKED)).toMatchObject({
      unlocked: false,
      unlockedAt: null,
      description: 'Keep playing the main story',
      gamerscore: 25,
      iconUrl: null,
      rarity: null,
      rarityCategory: null,
      secret: false,
    })
  })

  test('a reward that is not gamerscore is not counted', () => {
    expect(toXboxAchievement({ id: '9', rewards: [{ type: 'Art', value: '7' }] }).gamerscore).toBe(0)
  })
})

describe('toXbox360Achievement', () => {
  test('maps the flat 360 shape', () => {
    expect(toXbox360Achievement(RAW_360_ACHIEVEMENT)).toEqual({
      id: '49',
      name: 'Award',
      description: 'Got a 100 note streak',
      iconUrl: 'https://image-ssl.xboxlive.com/global/t.415607e7/ach/0/36',
      gamerscore: 30,
      unlocked: true,
      unlockedAt: '2026-10-09T21:22:41.5300000Z',
      secret: false,
      rarity: 24.73,
      rarityCategory: 'Common',
    })
  })

  test('without the numbers for its icon, it has none', () => {
    expect(toXbox360Achievement({ ...RAW_360_ACHIEVEMENT, imageId: undefined }).iconUrl).toBeNull()
  })

  test('a locked one shows the locked text and no date', () => {
    expect(toXbox360Achievement({ ...RAW_360_ACHIEVEMENT, unlocked: false, timeUnlocked: '0001-01-01T00:00:00Z' })).toMatchObject({
      unlocked: false, unlockedAt: null, description: 'Get a 100 note streak',
    })
  })
})

test('xboxPlatforms names the consoles and drops repeats', () => {
  expect(xboxPlatforms(['XboxOne', 'PC', 'Win32', 'Mystery'])).toEqual(['Xbox One', 'PC', 'Mystery'])
  expect(xboxPlatforms(undefined)).toEqual([])
})

test('sortByLastPlayed puts the latest first and the never-played last, without mutating', () => {
  const games = [
    xboxGameFixture({ titleId: '1', lastPlayed: null }),
    xboxGameFixture({ titleId: '2', lastPlayed: '2026-01-01T00:00:00Z' }),
    xboxGameFixture({ titleId: '3', lastPlayed: '2026-06-01T00:00:00Z' }),
  ]
  expect(sortByLastPlayed(games).map((g) => g.titleId)).toEqual(['3', '2', '1'])
  expect(games.map((g) => g.titleId)).toEqual(['1', '2', '3'])
})

describe('xboxToRecentAchievement', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { xboxToRecentAchievement, XBOX_PLATFORM } = require('./xboxMappers') as typeof import('./xboxMappers')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { xboxRecentFixture } = require('@/test-utils/xboxFixtures') as typeof import('@/test-utils/xboxFixtures')

  test("an Xbox unlock in RA's shape: no points, its own source, art and game", () => {
    expect(xboxToRecentAchievement(xboxRecentFixture({ achievementId: '49', earnedAt: '2026-10-09T21:22:41.5300000Z', gamerscore: 30 }))).toEqual({
      Date: '2026-10-09 21:22:41',
      HardcoreMode: '0',
      AchievementID: 49,
      Title: 'Prologue',
      Description: '',
      BadgeName: '',
      Points: 0,
      GameID: 1738914043,
      GameTitle: 'Modern Game',
      ConsoleName: XBOX_PLATFORM,
      Source: 'xbox',
      BadgeUrl: undefined,
      GameIconUrl: 'https://images-eds.xboxlive.com/image?url=modern',
    })
  })

  test('an id that is not a number does not become NaN, and the badge is kept when there is one', () => {
    const a = xboxToRecentAchievement(xboxRecentFixture({ achievementId: 'abc', iconUrl: 'https://x/i.png' }))
    expect(a.AchievementID).toBe(0)
    expect(a.BadgeUrl).toBe('https://x/i.png')
  })
})
