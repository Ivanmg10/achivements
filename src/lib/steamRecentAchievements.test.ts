jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getRecentlyPlayedGames: jest.fn(),
  getPlayerAchievements: jest.fn(),
  getSchemaForGame: jest.fn(),
}))

import { withSteamCache } from '@/lib/steamCache'
import { getRecentlyPlayedGames, getPlayerAchievements, getSchemaForGame } from '@/lib/steamClient'
import { loadRecentAchievements } from './steamRecentAchievements'

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
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('returns the newest unlocks across recent games, with names and badges', async () => {
  const list = await loadRecentAchievements(AUTH, 'spanish')

  expect(list.map((a) => a.apiname)).toEqual(['NEWEST', 'MIDDLE', 'OLD'])
  expect(list[0]).toEqual({
    appId: 1,
    gameTitle: 'Fallout 4',
    apiname: 'NEWEST',
    title: 'NEWEST name',
    badgeUrl: 'NEWEST.jpg',
    unlockedAt: new Date(900 * 1000).toISOString(),
  })
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
