jest.mock('@/lib/apiAuth', () => ({ requireViewerApiKey: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getUserRecentlyPlayedGames: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getUserRecentlyPlayedGames } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/public/user/recentlyPlayed?${query}`)

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: true, viewerId: '1', apiKey: 'viewer-key' })
  // A cache miss: the fetcher runs.
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('a viewer who cannot ask RA gets the auth answer, and RA is not called', async () => {
  const denied = NextResponse.json({ message: 'No RA account linked' }, { status: 400 })
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(request('u=Ivan'))).toBe(denied)
  expect(getUserRecentlyPlayedGames).not.toHaveBeenCalled()
})

test('400 without a username', async () => {
  expect((await GET(request(''))).status).toBe(400)
  expect(getUserRecentlyPlayedGames).not.toHaveBeenCalled()
})

test('asks RA with the viewer key, caches per user in any case, and only privately', async () => {
  ;(getUserRecentlyPlayedGames as jest.Mock).mockResolvedValue([{ GameID: 1 }])
  const res = await GET(request('u=Ivan'))
  expect(res.status).toBe(200)
  expect(getUserRecentlyPlayedGames).toHaveBeenCalledWith('Ivan', 'viewer-key', 7)
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('publicRecentlyPlayed:ivan')
  expect(res.headers.get('Cache-Control')).toMatch(/^private/)
})

test('only a well-formed answer is cached', () => {
  return GET(request('u=Ivan')).then(() => {
    const isValid = (withCache as jest.Mock).mock.calls[0][3] as (d: unknown) => boolean
    expect(isValid([{ GameID: 1 }])).toBe(true)
    expect(isValid(null)).toBe(false)
    expect(isValid({ error: 'nope' })).toBe(false)
  })
})

test('502 when RA fails', async () => {
  ;(getUserRecentlyPlayedGames as jest.Mock).mockRejectedValue(new Error('RA down'))
  expect((await GET(request('u=Ivan'))).status).toBe(502)
})
