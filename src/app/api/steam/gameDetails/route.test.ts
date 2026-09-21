jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getAppDetails: jest.fn(),
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { withSteamCache } from '@/lib/steamCache'
import { getAppDetails } from '@/lib/steamClient'

const STORE = {
  '377160': {
    success: true,
    data: { name: 'Fallout 4', developers: ['Bethesda Game Studios'], genres: [{ description: 'Rol' }] },
  },
}

function makeRequest(query: string) {
  return new NextRequest(`http://localhost:3000/api/steam/gameDetails?${query}`)
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', steamid: '765' } })
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  ;(getAppDetails as jest.Mock).mockResolvedValue(STORE)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('returns 401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET(makeRequest('appid=377160'))).status).toBe(401)
})

test.each(['', 'appid=', 'appid=abc', 'appid=-1'])('rejects %p with 400', async (q) => {
  expect((await GET(makeRequest(q))).status).toBe(400)
  expect(getAppDetails).not.toHaveBeenCalled()
})

test('returns the flattened store details', async () => {
  const res = await GET(makeRequest('appid=377160&lang=spanish'))
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toMatchObject({
    appId: 377160, name: 'Fallout 4', developers: ['Bethesda Game Studios'], genres: ['Rol'],
  })
})

test('is localised and cached globally per language', async () => {
  await GET(makeRequest('appid=377160&lang=spanish'))
  expect(getAppDetails).toHaveBeenCalledWith(377160, 'spanish')
  const [key, , , options] = (withSteamCache as jest.Mock).mock.calls[0]
  expect(key).toBe('steamStore:377160:spanish')
  // Global: no user id attached.
  expect(options.userId).toBeUndefined()
})

test('defaults to English', async () => {
  await GET(makeRequest('appid=377160'))
  expect(getAppDetails).toHaveBeenCalledWith(377160, 'english')
})

test('returns 404 for a game with no store entry, without caching that', async () => {
  ;(getAppDetails as jest.Mock).mockResolvedValue({ '377160': { success: false } })
  const res = await GET(makeRequest('appid=377160'))
  expect(res.status).toBe(404)
  const { shouldCache } = (withSteamCache as jest.Mock).mock.calls[0][3]
  expect(shouldCache(null)).toBe(false)
  expect(shouldCache({ appId: 1 })).toBe(true)
})

test('returns 503 when the store is unavailable', async () => {
  ;(getAppDetails as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await GET(makeRequest('appid=377160'))).status).toBe(503)
})
