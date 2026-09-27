jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getPlayerSummaries: jest.fn(),
  getSteamLevel: jest.fn(),
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { withSteamCache } from '@/lib/steamCache'
import { getPlayerSummaries, getSteamLevel } from '@/lib/steamClient'

const PLAYER = { steamid: '765', personaname: 'Ivan', avatarfull: 'a.jpg' }

/** Runs the real fetcher so the route's unwrapping logic is exercised. */
function passThroughCache() {
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', steamid: '765' } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  passThroughCache()
  ;(getSteamLevel as jest.Mock).mockResolvedValue({ response: { player_level: 78 } })
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

test('returns 503 when the app has no Steam key', async () => {
  delete process.env.STEAM_API_KEY
  expect((await GET()).status).toBe(503)
})

test('unwraps the first player and adds the Steam level', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [PLAYER] } })
  const res = await GET()
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toEqual({ ...PLAYER, level: 78 })
})

test('still returns the profile when the level is unavailable', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [PLAYER] } })
  ;(getSteamLevel as jest.Mock).mockRejectedValue(new Error('steam down'))
  const res = await GET()
  expect((res as unknown as { data: { level: unknown } }).data.level).toBeNull()
})

test('treats a malformed level payload as no level', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [PLAYER] } })
  ;(getSteamLevel as jest.Mock).mockResolvedValue({ response: {} })
  const res = await GET()
  expect((res as unknown as { data: { level: unknown } }).data.level).toBeNull()
})

test('caches under a new key, since the cached shape changed', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [PLAYER] } })
  await GET()
  expect((withSteamCache as jest.Mock).mock.calls[0][0]).toBe('steamProfile_v2:765')
})

test('returns 404 when Steam knows no such player', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [] } })
  expect((await GET()).status).toBe(404)
})

test('does not cache a missing player', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [] } })
  await GET()
  const { shouldCache } = (withSteamCache as jest.Mock).mock.calls[0][3]
  expect(shouldCache(null)).toBe(false)
  expect(shouldCache(PLAYER)).toBe(true)
})

test('returns 503 when Steam is unavailable', async () => {
  ;(getPlayerSummaries as jest.Mock).mockRejectedValue(new Error('steam down'))
  expect((await GET()).status).toBe(503)
})

test('sets a private Cache-Control matching the TTL', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [PLAYER] } })
  const res = await GET()
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=900')
})
