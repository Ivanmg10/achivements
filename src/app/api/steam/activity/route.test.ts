jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamRecentAchievements', () => ({ loadActivityAchievements: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { withSteamCache } from '@/lib/steamCache'
import { loadActivityAchievements } from '@/lib/steamRecentAchievements'

const LIST = [{ appId: 1, apiname: 'A' }]

function makeRequest(query = '') {
  return new NextRequest(`http://localhost:3000/api/steam/activity${query}`)
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', steamid: '765' } })
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  ;(loadActivityAchievements as jest.Mock).mockResolvedValue(LIST)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('returns 401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET(makeRequest())).status).toBe(401)
})

test('returns 400 when no Steam account is linked', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  expect((await GET(makeRequest())).status).toBe(400)
})

test('returns the window’s unlocks in the requested language, cached per player and language', async () => {
  const res = await GET(makeRequest('?lang=spanish'))
  expect((res as unknown as { data: unknown }).data).toEqual(LIST)
  expect(loadActivityAchievements).toHaveBeenCalledWith({ id: '7', steamid: '765', apiKey: 'steam-key' }, 'spanish')

  const [key, ttl, , options] = (withSteamCache as jest.Mock).mock.calls[0]
  expect(key).toBe('steamActivity:765:spanish')
  expect(ttl).toBe(5 * 60 * 1000)
  expect(options).toEqual({ userId: '7' })
})

test('defaults to English and is never browser-cached', async () => {
  const res = await GET(makeRequest())
  expect(loadActivityAchievements).toHaveBeenCalledWith(expect.anything(), 'english')
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=0')
})

test('returns 503 when Steam is unavailable', async () => {
  ;(loadActivityAchievements as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await GET(makeRequest())).status).toBe(503)
})
