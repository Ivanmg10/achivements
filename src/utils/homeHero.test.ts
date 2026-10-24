import { homeHeroOf } from './homeHero'
import type { RecentFeedItem } from './steamFeed'

const base = { maxPossible: 50, numAwarded: 25, pctWon: 50, consoleName: 'PS5', imageIcon: 'https://img/icon.png', lastPlayed: null }

test('nothing to show without a game', () => {
  expect(homeHeroOf(undefined)).toBeNull()
})

test('an RA game counts its hardcore unlocks and takes its icon', () => {
  const item = {
    source: 'ra', key: 'ra-1', lastPlayed: '2026-10-23 10:00:00',
    game: { GameID: 1, Title: 'Zelda', ImageIcon: '/Images/1.png', ConsoleName: 'SNES', NumPossibleAchievements: 40, NumAchieved: 20, NumAchievedHardcore: 10 },
  } as unknown as RecentFeedItem
  expect(homeHeroOf(item)).toMatchObject({ source: 'ra', id: 1, title: 'Zelda', earned: 10, total: 40, pct: 25, image: 'https://retroachievements.org/Images/1.png' })
})

test('a Steam game takes its wide hero art', () => {
  const item = { source: 'steam', key: 's-620', lastPlayed: null, game: { ...base, _source: 'steam', id: 620, title: 'Portal 2' } } as unknown as RecentFeedItem
  const hero = homeHeroOf(item)!
  expect(hero).toMatchObject({ source: 'steam', id: 620, earned: 25, total: 50, pct: 50 })
  expect(hero.image).toContain('620')
})

test('a PSN collection shows its newest game, as PSN', () => {
  const g = { ...base, _source: 'psn', id: 7, title: 'AC II', heroUrl: 'https://img/hero.jpg', coverUrl: null }
  const item = { source: 'psnCollection', key: 'c', lastPlayed: null, collection: {}, games: [g] } as unknown as RecentFeedItem
  expect(homeHeroOf(item)).toMatchObject({ source: 'psn', id: 7, title: 'AC II' })
})
