import { psnToRecentAchievement, PSN_PLATFORM } from './psnMappers'

test("a trophy in RA's recent-achievement shape, marked as PSN", () => {
  expect(
    psnToRecentAchievement({
      gameId: 2018800,
      titleId: 'NPWR20188_00',
      gameTitle: 'Astro Bot',
      gameIconUrl: 'https://g.png',
      trophyId: 3,
      name: 'Jump',
      iconUrl: 'https://t.png',
      type: 'gold',
      earnedAt: '2026-01-02T20:30:00.000Z',
      rarity: 5,
    }),
  ).toEqual({
    Date: '2026-01-02 20:30:00',
    HardcoreMode: '0',
    AchievementID: 3,
    Title: 'Jump',
    Description: '',
    BadgeName: '',
    Points: 0,
    GameID: 2018800,
    GameTitle: 'Astro Bot',
    ConsoleName: PSN_PLATFORM,
    Source: 'psn',
    BadgeUrl: 'https://t.png',
    GameIconUrl: 'https://g.png',
  })
})

test('a trophy with no icon has no badge URL', () => {
  const a = psnToRecentAchievement({
    gameId: 1, titleId: 'NPWR00000_01', gameTitle: 'X', gameIconUrl: '', trophyId: 0, name: 'Y',
    iconUrl: null, type: 'bronze', earnedAt: '2026-01-02T00:00:00Z', rarity: null,
  })
  expect(a.BadgeUrl).toBeUndefined()
})
