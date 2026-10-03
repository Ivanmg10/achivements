jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getAppInfo: jest.fn(),
}))

import { GET } from './route'
import { NextRequest } from 'next/server'
import { withSteamCache } from '@/lib/steamCache'
import { getAppInfo } from '@/lib/steamClient'

const COVER = 'https://cdn.akamai.steamstatic.com/steam/apps/620/library_600x900.jpg'
const HASH = '25a5a16b2423bf7487ac5340b5b0948cef48c5f8'

function makeRequest(query: string) {
  return new NextRequest(`http://localhost:3000/api/steam/icon?${query}`)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  ;(getAppInfo as jest.Mock).mockResolvedValue({ data: { '620': { common: { clienticon: HASH } } } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test.each(['', 'appid=', 'appid=abc', 'appid=-1'])('rejects %p with 400', async (q) => {
  expect((await GET(makeRequest(q))).status).toBe(400)
  expect(getAppInfo).not.toHaveBeenCalled()
})

test('redirects to the client icon on the CDN', async () => {
  const res = await GET(makeRequest('appid=620'))
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe(
    `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/620/${HASH}.ico`,
  )
  expect(withSteamCache).toHaveBeenCalledWith('clienticon:620', expect.any(Number), expect.any(Function))
})

test.each([
  ['no clienticon', { data: { '620': { common: {} } } }],
  ['a malformed hash', { data: { '620': { common: { clienticon: '../x' } } } }],
  ['no app entry', { data: {} }],
])('falls back to the cover for %s', async (_label, info) => {
  ;(getAppInfo as jest.Mock).mockResolvedValue(info)
  const res = await GET(makeRequest('appid=620'))
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe(COVER)
})

test('falls back to the cover, uncached, when app info is unreachable', async () => {
  ;(getAppInfo as jest.Mock).mockRejectedValue(new Error('down'))
  const res = await GET(makeRequest('appid=620'))
  expect(res.headers.get('location')).toBe(COVER)
  expect(res.headers.get('Cache-Control')).toBe('no-store')
})
