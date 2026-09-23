jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getRecentlyPlayedGames: jest.fn(),
  getOwnedGames: jest.fn(),
  getGlobalAchievementPercentages: jest.fn(),
  getPlayerAchievements: jest.fn(),
  getSchemaForGame: jest.fn(),
}))

import { withSteamCache } from '@/lib/steamCache'
import { getGlobalAchievementPercentages, getOwnedGames, getRecentlyPlayedGames, getPlayerAchievements, getSchemaForGame } from '@/lib/steamClient'
import { loadActivityAchievements, loadRecentAchievements } from './steamRecentAchievements'

const AUTH = { id: '7', steamid: '765', apiKey: 'key' }

function unlock(apiname: string, unlocktime: number, achieved: 0 | 1 = 1) {
  return { apiname, achieved, unlocktime }
}

function schema(...names: string[]) {
  return { game: { availableGameStats: { achievements: names.map((n) => ({
    name: n, displayName: `${n} name`, icon: `${n}.jpg`, icongray: '', hidden: 0, defaultvalue: 0,
  })) } } }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [
    { appid: 1, name: 'Fallout 4', playtime_forever: 10 },
    { appid: 2, name: 'Hades', playtime_forever: 10 },
  ] } })
  ;(getPlayerAchievements as jest.Mock).mockImplementation(async (_s: string, _k: string, appId: number) => ({
    playerstats: {
      success: true,
      achievements: appId === 1
        ? [unlock('OLD', 100), unlock('NEWEST', 900), unlock('LOCKED', 0, 0)]
        : [unlock('MIDDLE', 500), unlock('UNDATED', 0)],
    },
  }))
  ;(getSchemaForGame as jest.Mock).mockImplementation(async (appId: number) =>
    appId === 1 ? schema('OLD', 'NEWEST', 'LOCKED') : schema('MIDDLE', 'UNDATED'),
  )
  ;(getGlobalAchievementPercentages as jest.Mock).mockImplementation(async (appId: number) =>
    appId === 1 ? { achievementpercentages: { achievements: [{ name: 'NEWEST', percent: 3.5 }] } } : {},
  )
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('returns the newest unlocks across recent games, with names, badges and rarity', async () => {
  const list = await loadRecentAchievements(AUTH, 'spanish')

  expect(list.map((a) => a.apiname)).toEqual(['NEWEST', 'MIDDLE', 'OLD'])
  expect(list[0]).toEqual({
    appId: 1,
    gameTitle: 'Fallout 4',
    apiname: 'NEWEST',
    title: 'NEWEST name',
    badgeUrl: 'NEWEST.jpg',
    unlockedAt: new Date(900 * 1000).toISOString(),
    globalPct: 3.5,
  })
  // No rarity from Steam for game 2: the unlock still lists, without it.
  expect(list[1].globalPct).toBeNull()
})

test('leaves out locked and undated unlocks', async () => {
  const names = (await loadRecentAchievements(AUTH, 'english')).map((a) => a.apiname)
  expect(names).not.toContain('LOCKED')
  expect(names).not.toContain('UNDATED')
})

test('caps the list and fetches schemas only for games that made it', async () => {
  const list = await loadRecentAchievements(AUTH, 'spanish', 1)
  expect(list.map((a) => a.apiname)).toEqual(['NEWEST'])
  expect(getSchemaForGame).toHaveBeenCalledTimes(1)
  expect(getSchemaForGame).toHaveBeenCalledWith(1, 'key', 'spanish')
})

test('scans the ten most recent games', async () => {
  await loadRecentAchievements(AUTH, 'english')
  expect(getRecentlyPlayedGames).toHaveBeenCalledWith('765', 'key', 10)
})

test('skips a game whose unlocks fail instead of failing the list', async () => {
  ;(getPlayerAchievements as jest.Mock).mockImplementation(async (_s: string, _k: string, appId: number) => {
    if (appId === 1) throw Object.assign(new Error('boom'), { status: 500 })
    return { playerstats: { success: true, achievements: [unlock('MIDDLE', 500)] } }
  })
  const list = await loadRecentAchievements(AUTH, 'english')
  expect(list.map((a) => a.apiname)).toEqual(['MIDDLE'])
})

test('falls back to the api name when a schema cannot be loaded', async () => {
  ;(getSchemaForGame as jest.Mock).mockRejectedValue(new Error('steam down'))
  const [first] = await loadRecentAchievements(AUTH, 'english')
  expect(first.title).toBe('NEWEST')
  expect(first.badgeUrl).toBe('')
})

test('names a game without a title by its app id', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [{ appid: 1, playtime_forever: 1 }] } })
  const [first] = await loadRecentAchievements(AUTH, 'english')
  expect(first.gameTitle).toBe('App 1')
})

test('returns nothing when nothing was played recently', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: {} })
  await expect(loadRecentAchievements(AUTH, 'english')).resolves.toEqual([])
})

describe('loadActivityAchievements', () => {
  // now = day 100 (in seconds: 100 * 86400); a 60-day window starts at day 40.
  const DAY = 86_400
  const NOW_MS = 100 * DAY * 1000

  beforeEach(() => {
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: [
      { appid: 1, name: 'Fallout 4', has_community_visible_stats: true, rtime_last_played: 90 * DAY },
      { appid: 2, name: 'Hades', has_community_visible_stats: true, rtime_last_played: 95 * DAY },
      { appid: 3, name: 'Stale', has_community_visible_stats: true, rtime_last_played: 10 * DAY },
      { appid: 4, name: 'No stats', has_community_visible_stats: false, rtime_last_played: 99 * DAY },
    ] } })
    ;(getPlayerAchievements as jest.Mock).mockImplementation(async (_s: string, _k: string, appId: number) => ({
      playerstats: {
        success: true,
        achievements: appId === 1
          ? [unlock('OLD', 20 * DAY), unlock('NEWEST', 90 * DAY)]
          : [unlock('MIDDLE', 60 * DAY), unlock('UNDATED', 0)],
      },
    }))
  })

  test('returns every unlock inside the window, newest first, from games played in it', async () => {
    const list = await loadActivityAchievements(AUTH, 'english', 60, NOW_MS)
    expect(list.map((a) => a.apiname)).toEqual(['NEWEST', 'MIDDLE'])
    expect(list[0]).toMatchObject({ appId: 1, gameTitle: 'Fallout 4', title: 'NEWEST name' })
  })

  test('skips games not played in the window or without stats', async () => {
    await loadActivityAchievements(AUTH, 'english', 60, NOW_MS)
    const scanned = (getPlayerAchievements as jest.Mock).mock.calls.map(([, , appId]) => appId)
    expect(scanned.sort()).toEqual([1, 2])
  })

  test('is empty when the library cannot be read as expected', async () => {
    ;(getOwnedGames as jest.Mock).mockResolvedValue({})
    expect(await loadActivityAchievements(AUTH, 'english', 60, NOW_MS)).toEqual([])
  })
})
