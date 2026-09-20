jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getOwnedGames: jest.fn(),
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { withSteamCache } from '@/lib/steamCache'
import { getOwnedGames } from '@/lib/steamClient'
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
