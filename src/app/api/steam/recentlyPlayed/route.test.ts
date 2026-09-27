jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getRecentlyPlayedGames: jest.fn(),
  getPlayerAchievements: jest.fn(),
  getOwnedGames: jest.fn(),
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { withSteamCache } from '@/lib/steamCache'
import { getRecentlyPlayedGames, getPlayerAchievements, getOwnedGames } from '@/lib/steamClient'
import type { SteamGameProgress } from '@/types/steam'

function data(res: unknown) {
  return (res as { data: SteamGameProgress[] }).data
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', steamid: '765' } })
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: [] } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('returns 401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET()).status).toBe(401)
})

test('returns 400 when no Steam account is linked', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  expect((await GET()).status).toBe(400)
})

test('maps Steam games onto the unified shape', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({
    response: { games: [{ appid: 730, name: 'CS2', playtime_forever: 100, playtime_2weeks: 10 }] },
  })

  const games = data(await GET())
  expect(games).toHaveLength(1)
  expect(games[0]._source).toBe('steam')
  expect(games[0].id).toBe(730)
  expect(games[0].title).toBe('CS2')
})

test('returns an empty list when nothing was played recently', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: {} })
  expect(data(await GET())).toEqual([])
})

test('survives a completely empty Steam payload', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue(null)
  expect(data(await GET())).toEqual([])
})

test('asks Steam for 20 games', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [] } })
  await GET()
  expect(getRecentlyPlayedGames).toHaveBeenCalledWith('765', 'steam-key', 20)
})

test('returns 503 when Steam is unavailable', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockRejectedValue(new Error('steam down'))
  expect((await GET()).status).toBe(503)
})

test('is cached in the DB for 5 minutes but never by the browser', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [] } })
  const res = await GET()
  expect((withSteamCache as jest.Mock).mock.calls[0][1]).toBe(300000)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=0')
})

test('fills achievement counts for played games with stats', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({
    response: { games: [
      { appid: 730, name: 'CS2', playtime_forever: 100, has_community_visible_stats: true },
      { appid: 440, name: 'No stats', playtime_forever: 100, has_community_visible_stats: false },
    ] },
  })
  ;(getPlayerAchievements as jest.Mock).mockResolvedValue({
    playerstats: { success: true, achievements: [
      { apiname: 'A', achieved: 1, unlocktime: 1 },
      { apiname: 'B', achieved: 0, unlocktime: 0 },
    ] },
  })

  const [cs2, noStats] = data(await GET())
  expect(cs2).toMatchObject({ achievementsLoaded: true, numAwarded: 1, maxPossible: 2, pctWon: 50 })
  expect(noStats.achievementsLoaded).toBe(false)
  expect(getPlayerAchievements).toHaveBeenCalledTimes(1)
})

describe('last played dates', () => {
  // Shape seen from the real API: GetRecentlyPlayedGames has no
  // rtime_last_played and is not ordered by date.
  const RECENT = { response: { games: [
    { appid: 12210, name: 'GTA IV', playtime_forever: 500, playtime_2weeks: 300 },
    { appid: 311210, name: 'Black Ops III', playtime_forever: 900, playtime_2weeks: 20 },
    { appid: 377160, name: 'Fallout 4', playtime_forever: 100, playtime_2weeks: 50 },
  ] } }

  test('takes each date from the owned list and orders newest first', async () => {
    ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue(RECENT)
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: [
      { appid: 12210, playtime_forever: 500, rtime_last_played: 1789324742 },
      { appid: 311210, playtime_forever: 900, rtime_last_played: 1789808762 },
      { appid: 377160, playtime_forever: 100, rtime_last_played: 1788802145 },
    ] } })

    const games = data(await GET())
    expect(games.map((g) => g.title)).toEqual(['Black Ops III', 'GTA IV', 'Fallout 4'])
    expect(games[0].lastPlayed).toBe(new Date(1789808762 * 1000).toISOString())
  })

  test('still returns the games, undated, if the owned lookup fails', async () => {
    ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue(RECENT)
    ;(getOwnedGames as jest.Mock).mockRejectedValue(new Error('steam down'))

    const games = data(await GET())
    expect(games).toHaveLength(3)
    expect(games.every((g) => g.lastPlayed === null)).toBe(true)
  })

  test('leaves a game undated when it is missing from the owned list (e.g. family sharing)', async () => {
    ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue(RECENT)
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: [
      { appid: 12210, playtime_forever: 500, rtime_last_played: 1789324742 },
    ] } })

    const games = data(await GET())
    expect(games[0].title).toBe('GTA IV')
    expect(games.slice(1).every((g) => g.lastPlayed === null)).toBe(true)
  })

  test('keeps a date Steam did send on the recent entry', async () => {
    ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [
      { appid: 1, name: 'Dated', playtime_forever: 5, rtime_last_played: 1700000000 },
    ] } })
    const [g] = data(await GET())
    expect(g.lastPlayed).toBe(new Date(1700000000 * 1000).toISOString())
  })
})

test('takes the achievements flag from the owned list — the recent list has none', async () => {
  // Real shape: GetRecentlyPlayedGames sends no has_community_visible_stats,
  // so every recent game looked achievement-less: no bar, nothing to expand.
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [
    { appid: 377160, name: 'Fallout 4', playtime_forever: 29055, playtime_2weeks: 60 },
  ] } })
  ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: [
    { appid: 377160, playtime_forever: 29055, rtime_last_played: 1788802145, has_community_visible_stats: true },
  ] } })
  ;(getPlayerAchievements as jest.Mock).mockResolvedValue({
    playerstats: { success: true, achievements: [{ apiname: 'A', achieved: 1, unlocktime: 1 }] },
  })

  const [g] = data(await GET())
  expect(g.hasStats).toBe(true)
  expect(g).toMatchObject({ achievementsLoaded: true, numAwarded: 1, maxPossible: 1 })
})

test('a game missing from the owned list keeps no stats flag rather than guessing', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [
    { appid: 9, name: 'Shared', playtime_forever: 10 },
  ] } })
  const [g] = data(await GET())
  expect(g.hasStats).toBe(false)
  expect(getPlayerAchievements).not.toHaveBeenCalled()
})
