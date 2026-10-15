import type { XboxAchievement, XboxGameProgress, XboxProfile, XboxRecentAchievement } from '@/types/xbox'
import type { Raw360Achievement, RawAchievement, RawProfileUser, RawTitle } from '@/utils/xboxMappers'

/*
 * Shapes recorded from the real OpenXBL API (2026-10-15), with invented ids,
 * names and numbers: nothing here belongs to a real account.
 */

export const RAW_PROFILE: RawProfileUser = {
  id: '2535400000000001',
  settings: [
    { id: 'Gamertag', value: 'TestPlayer' },
    { id: 'GameDisplayPicRaw', value: 'http://images-eds-ssl.xboxlive.com/image?url=abc&format=png' },
    { id: 'Gamerscore', value: '10242' },
    { id: 'AccountTier', value: 'Silver' },
    { id: 'Bio', value: 'Plays everything' },
    { id: 'RealName', value: '' },
  ],
}

/** A modern title: Xbox reports its achievement total as 0 while the gamerscore total is real. */
export const RAW_MODERN_TITLE: RawTitle = {
  titleId: '1738914043',
  name: 'Modern Game',
  displayImage: 'http://images-eds.xboxlive.com/image?url=modern',
  devices: ['XboxSeries', 'PC', 'Win32'],
  achievement: { currentAchievements: 15, totalAchievements: 0, currentGamerscore: 200, totalGamerscore: 1345, progressPercentage: 14 },
  titleHistory: { lastTimePlayed: '2026-10-15T15:07:05.562Z' },
}

export const RAW_360_TITLE: RawTitle = {
  titleId: '1096157159',
  name: 'Old Game',
  displayImage: null,
  devices: ['Xbox360'],
  achievement: { currentAchievements: 14, totalAchievements: 50, currentGamerscore: 180, totalGamerscore: 1000, progressPercentage: 18 },
  titleHistory: { lastTimePlayed: '2026-10-01T10:00:00.000Z' },
}

export const RAW_ACHIEVED: RawAchievement = {
  id: '1',
  name: 'Prologue',
  description: 'Complete the Prologue',
  lockedDescription: 'Finish the first chapter',
  progressState: 'Achieved',
  progression: { timeUnlocked: '2026-01-06T18:20:22.7030000Z' },
  mediaAssets: [{ type: 'Icon', url: 'https://images-eds-ssl.xboxlive.com/image?url=icon' }],
  isSecret: true,
  rewards: [{ type: 'Gamerscore', value: '10' }],
  rarity: { currentCategory: 'Common', currentPercentage: 80.46 },
}

export const RAW_LOCKED: RawAchievement = {
  id: '3',
  name: 'An Oath Fulfilled',
  description: 'Complete Act 2',
  lockedDescription: 'Keep playing the main story',
  progressState: 'NotStarted',
  progression: { timeUnlocked: '0001-01-01T00:00:00.0000000Z' },
  mediaAssets: [],
  rewards: [{ type: 'Gamerscore', value: '25' }],
}

export const RAW_360_ACHIEVEMENT: Raw360Achievement = {
  id: 49,
  name: 'Award',
  description: 'Got a 100 note streak',
  lockedDescription: 'Get a 100 note streak',
  unlocked: true,
  gamerscore: 30,
  timeUnlocked: '2026-10-09T21:22:41.5300000Z',
  rarity: { currentCategory: 'Common', currentPercentage: 24.73 },
}

/** A complete XboxGameProgress, so a fixture only says what its test is about and a field added later does not break twenty literals. */
export function xboxGameFixture(overrides: Partial<XboxGameProgress> = {}): XboxGameProgress {
  return {
    _source: 'xbox',
    id: 1738914043,
    titleId: '1738914043',
    title: 'Modern Game',
    imageIcon: 'https://images-eds.xboxlive.com/image?url=modern',
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
    ...overrides,
  }
}

export function xboxProfileFixture(overrides: Partial<XboxProfile> = {}): XboxProfile {
  return { xuid: '2535400000000001', gamertag: 'TestPlayer', avatarUrl: null, bio: '', gamerscore: 10242, tier: 'Silver', ...overrides }
}

export function xboxAchievementFixture(overrides: Partial<XboxAchievement> = {}): XboxAchievement {
  return {
    id: '1',
    name: 'Prologue',
    description: 'Complete the Prologue',
    iconUrl: null,
    gamerscore: 10,
    unlocked: true,
    unlockedAt: '2026-01-06T18:20:22.7030000Z',
    secret: false,
    rarity: 80.46,
    rarityCategory: 'Common',
    ...overrides,
  }
}

export function xboxRecentFixture(overrides: Partial<XboxRecentAchievement> = {}): XboxRecentAchievement {
  return {
    gameId: 1738914043,
    titleId: '1738914043',
    gameTitle: 'Modern Game',
    gameIconUrl: 'https://images-eds.xboxlive.com/image?url=modern',
    achievementId: '1',
    name: 'Prologue',
    iconUrl: null,
    gamerscore: 10,
    earnedAt: '2026-01-06T18:20:22.7030000Z',
    rarity: 80.46,
    ...overrides,
  }
}
