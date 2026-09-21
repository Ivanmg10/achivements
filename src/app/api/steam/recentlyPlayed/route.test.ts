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
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { withSteamCache } from '@/lib/steamCache'
import { getRecentlyPlayedGames, getPlayerAchievements } from '@/lib/steamClient'
import type { SteamGameProgress } from '@/types/steam'

function data(res: unknown) {
  return (res as { data: SteamGameProgress[] }).data
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', steamid: '765' } })
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
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

test('caches for the short recently-played TTL', async () => {
  ;(getRecentlyPlayedGames as jest.Mock).mockResolvedValue({ response: { games: [] } })
  const res = await GET()
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=300')
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
