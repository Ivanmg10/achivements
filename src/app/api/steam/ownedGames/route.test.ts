jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getOwnedGames: jest.fn(),
  getPlayerAchievements: jest.fn(),
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { withSteamCache } from '@/lib/steamCache'
import { getOwnedGames, getPlayerAchievements } from '@/lib/steamClient'
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

test('sorts the library by playtime, most played first', async () => {
  ;(getOwnedGames as jest.Mock).mockResolvedValue({
    response: { games: [
      { appid: 1, name: 'Little', playtime_forever: 10 },
      { appid: 2, name: 'Most', playtime_forever: 900 },
      { appid: 3, name: 'Middle', playtime_forever: 300 },
    ] },
  })

  expect(data(await GET()).map((g) => g.title)).toEqual(['Most', 'Middle', 'Little'])
})

test('returns an empty list for a private profile', async () => {
  ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: {} })
  expect(data(await GET())).toEqual([])
})

test('returns 503 when Steam is unavailable', async () => {
  ;(getOwnedGames as jest.Mock).mockRejectedValue(new Error('steam down'))
  expect((await GET()).status).toBe(503)
})

test('caches for an hour', async () => {
  ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: [] } })
  expect((await GET()).headers.get('Cache-Control')).toBe('private, max-age=3600')
})

describe('filling counts across a large library', () => {
  // 61 countable games: one more than a single request fetches. The most-played
  // one was last touched longest ago, so it is the one left for the next request
  // even though it sorts first in the output.
  const games = Array.from({ length: 61 }, (_, i) => ({
    appid: i + 1,
    name: `G${i + 1}`,
    playtime_forever: i === 0 ? 99999 : 100 + i,
    rtime_last_played: i === 0 ? 1 : 1_700_000_000 + i,
    has_community_visible_stats: true,
  }))

  beforeEach(() => {
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games } })
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue({
      playerstats: { success: true, achievements: [{ apiname: 'A', achieved: 1, unlocktime: 1 }] },
    })
  })

  test('fetches the most recently played first, up to the per-request cap', async () => {
    const out = data(await GET())
    expect(getPlayerAchievements).toHaveBeenCalledTimes(60)
    expect(out[0].title).toBe('G1')
    expect(out[0].achievementsLoaded).toBe(false)
    expect(out.filter((g) => g.achievementsLoaded)).toHaveLength(60)
  })

  test('does not cache an unfinished fill, so the next request carries on', async () => {
    const res = await GET()
    const { shouldCache } = (withSteamCache as jest.Mock).mock.calls[0][3]
    expect(shouldCache()).toBe(false)
    // Nor may the browser reuse it for the follow-up request.
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=0')
  })

  test('caches a finished fill for an hour', async () => {
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: games.slice(1) } })
    const res = await GET()
    const { shouldCache } = (withSteamCache as jest.Mock).mock.calls[0][3]
    expect(shouldCache()).toBe(true)
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=3600')
  })
})

test('keeps games with no last-played date in the list', async () => {
  ;(getOwnedGames as jest.Mock).mockResolvedValue({
    response: { games: [
      { appid: 1, name: 'Never', playtime_forever: 0 },
      { appid: 2, name: 'Played', playtime_forever: 5, rtime_last_played: 1_700_000_000 },
    ] },
  })
  expect(data(await GET()).map((g) => g.title)).toEqual(['Played', 'Never'])
})
