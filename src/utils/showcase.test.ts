import { parseShowcaseEntry, raShowcaseEntry, showcaseChoices, showcaseFromUnlock, showcaseKey } from './showcase'
import type { RecentAchievement } from '@/types/types'

const NOW = Date.parse('2026-10-20T12:00:00Z')
const OK = {
  source: 'steam',
  gameId: 620,
  achievementKey: 'ACH_WIN',
  gameTitle: 'Portal 2',
  title: 'Win',
  description: '',
  badge: 'https://cdn/a.jpg',
  earnedAt: '2026-10-19T10:00:00Z',
}

test('a sound entry is kept, trimmed, with an empty description as none', () => {
  expect(parseShowcaseEntry({ ...OK, title: ' Win ' }, NOW)).toEqual({ ...OK, description: null, earnedAt: '2026-10-19T10:00:00.000Z' })
})

test('anything off is refused', () => {
  for (const bad of [
    null,
    { ...OK, source: 'gog' },
    { ...OK, gameId: 0 },
    { ...OK, gameId: 1.5 },
    { ...OK, achievementKey: '' },
    { ...OK, title: 'x'.repeat(201) },
    { ...OK, badge: 'http://cdn/a.jpg' },
    { ...OK, earnedAt: null },
    { ...OK, earnedAt: 'yesterday' },
    { ...OK, earnedAt: '2026-12-01T00:00:00Z' },
  ]) {
    expect(parseShowcaseEntry(bad, NOW)).toBeNull()
  }
})

test('an unlock from the year becomes an entry, keyed by its platform id', () => {
  const ra = { Date: '2026-10-19 10:00:00', AchievementID: 42, Title: 'A', Description: 'Do it', BadgeName: '7', GameID: 3, GameTitle: 'Zelda' } as RecentAchievement
  expect(showcaseFromUnlock(ra)).toMatchObject({ source: 'ra', achievementKey: '42', description: 'Do it', badge: 'https://media.retroachievements.org/Badge/7.png' })
  const steam = { ...ra, Source: 'steam', Key: 'ACH_WIN', BadgeUrl: 'https://cdn/a.jpg', Description: '' } as RecentAchievement
  expect(showcaseFromUnlock(steam)).toMatchObject({ source: 'steam', achievementKey: 'ACH_WIN', description: null })
  // Without its platform id it cannot be told apart from another: left out.
  expect(showcaseFromUnlock({ ...steam, Key: undefined })).toBeNull()
  expect(showcaseKey({ source: 'ra', gameId: 3, achievementKey: '42' })).toBe('ra:3:42')
})

test('an RA achievement is an entry only once earned, hardcore date first', () => {
  const a = { ID: 7, Title: 'A', Description: 'Do it', BadgeName: '9', DateEarned: '2026-10-01 10:00:00', DateEarnedHardcore: '2026-10-02 10:00:00' }
  expect(raShowcaseEntry(a, 3, 'Zelda')).toMatchObject({ source: 'ra', gameId: 3, achievementKey: '7', badge: 'https://media.retroachievements.org/Badge/9.png' })
  expect(raShowcaseEntry(a, 3, 'Zelda')!.earnedAt.slice(0, 10)).toBe('2026-10-02')
  expect(raShowcaseEntry({ ...a, DateEarned: null, DateEarnedHardcore: null }, 3, 'Zelda')).toBeNull()
})

test('a game’s achievements as choices: earned first, newest first, then the rest; hidden unearned ones concealed', () => {
  const choices = showcaseChoices('steam', 620, 'Portal 2', [
    { key: 'A', title: 'Old', badge: 'https://b/a.jpg', earnedAt: '2026-01-01T00:00:00Z' },
    { key: 'B', title: 'Locked', badge: 'https://b/b.jpg', earnedAt: null },
    { key: 'C', title: 'New', badge: 'https://b/c.jpg', earnedAt: '2026-10-01T00:00:00Z' },
    { key: 'D', title: 'Secret', description: 'spoiler', badge: 'https://b/d.jpg', earnedAt: null, hidden: true },
  ])
  expect(choices.map((c) => c.key)).toEqual(['C', 'A', 'B', 'D'])
  expect(choices[0].entry).toMatchObject({ source: 'steam', gameId: 620, achievementKey: 'C', gameTitle: 'Portal 2' })
  expect(choices[2].entry).toBeNull()
  expect(choices[3]).toMatchObject({ concealed: true, description: null, badge: null })
})
