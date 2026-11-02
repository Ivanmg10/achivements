import { artVerdict, heroArtFits, homeHeroOf } from './homeHero'
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
  expect(homeHeroOf(item)).toMatchObject({ source: 'ra', id: 1, title: 'Zelda', earned: 10, total: 40, pct: 25, art: [], icon: 'https://retroachievements.org/Images/1.png' })
})

test('a Steam game takes its wide hero art', () => {
  const item = { source: 'steam', key: 's-620', lastPlayed: null, game: { ...base, _source: 'steam', id: 620, title: 'Portal 2' } } as unknown as RecentFeedItem
  const hero = homeHeroOf(item)!
  expect(hero).toMatchObject({ source: 'steam', id: 620, earned: 25, total: 50, pct: 50 })
  expect(hero.art).toHaveLength(2)
  expect(hero.art[0]).toContain('library_hero')
  expect(hero.art[1]).toContain('header')
})

test('PSN takes its backdrop, and Xbox has none until its details come', () => {
  const psn = { source: 'psn', key: 'p', lastPlayed: null, game: { ...base, _source: 'psn', id: 7, title: 'X', heroUrl: 'https://img/hero.jpg', coverUrl: null } } as unknown as RecentFeedItem
  expect(homeHeroOf(psn)!.art).toEqual(['https://img/hero.jpg'])
  const xbox = { source: 'xbox', key: 'x', lastPlayed: null, game: { ...base, _source: 'xbox', id: 9, title: 'Y' } } as unknown as RecentFeedItem
  expect(homeHeroOf(xbox)).toMatchObject({ art: [], icon: 'https://img/icon.png' })
})

test('a PSN game with only a box art has no wide art: it is its poster, not a stretched background', () => {
  const psn = { source: 'psn', key: 'p', lastPlayed: null, game: { ...base, _source: 'psn', id: 7, title: 'X', heroUrl: null, coverUrl: 'https://img/cover.jpg' } } as unknown as RecentFeedItem
  expect(homeHeroOf(psn)).toMatchObject({ art: [], icon: 'https://img/cover.jpg' })
})

test('artVerdict sets a small wide picture aside and refuses what can never be a background', () => {
  expect(artVerdict(1920, 620, 2536, 380)).toBe('fit')
  expect(artVerdict(256, 224, 2536, 380)).toBe('soft')
  expect(artVerdict(1000, 562, 2536, 380)).toBe('soft')
  expect(artVerdict(600, 900, 2536, 380)).toBe('bad')
  expect(artVerdict(0, 0, 2536, 380)).toBe('bad')
})

describe('heroArtFits', () => {
  const WIDE_SCREEN = [2536, 380] as const
  const PHONE = [366, 300] as const

  test.each([
    ['Steam hero', 1920, 620],
    ['16:9 backdrop', 3840, 2160],
    ['IGDB screenshot', 1280, 720],
  ])('%s is fit for a 2560 px screen', (_, width, height) => {
    expect(heroArtFits(width, height, ...WIDE_SCREEN)).toBe(true)
  })

  test('art too small for the box is refused there and fine where it is sharp', () => {
    expect(heroArtFits(460, 215, ...WIDE_SCREEN)).toBe(false)
    expect(heroArtFits(460, 215, ...PHONE)).toBe(true)
    expect(heroArtFits(1000, 562, ...WIDE_SCREEN)).toBe(false)
  })

  test('height counts too: a thin strip would be stretched by the cover', () => {
    expect(heroArtFits(800, 100, ...PHONE)).toBe(false)
  })

  test('a console screen fits, but extreme shapes do not survive the crop', () => {
    expect(heroArtFits(256, 224, ...PHONE)).toBe(true)
    expect(heroArtFits(600, 900, ...PHONE)).toBe(false)
    expect(heroArtFits(800, 800, ...PHONE)).toBe(false)
    expect(heroArtFits(2000, 400, ...PHONE)).toBe(false)
  })

  test('a picture that decoded to nothing is refused', () => {
    expect(heroArtFits(0, 0, ...PHONE)).toBe(false)
  })
})

test('a PSN collection shows its newest game, as PSN', () => {
  const g = { ...base, _source: 'psn', id: 7, title: 'AC II', heroUrl: 'https://img/hero.jpg', coverUrl: null }
  const item = { source: 'psnCollection', key: 'c', lastPlayed: null, collection: {}, games: [g] } as unknown as RecentFeedItem
  expect(homeHeroOf(item)).toMatchObject({ source: 'psn', id: 7, title: 'AC II' })
})
