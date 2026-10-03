jest.mock('@/lib/apiAuth', () => ({ requireViewerApiKey: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getGameInfoAndUserProgress: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getGameInfoAndUserProgress } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/public/user/gameProgression?${query}`)

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: true, viewerId: '1', apiKey: 'viewer-key' })
  // A cache miss: the fetcher runs.
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('a viewer who cannot ask RA gets the auth answer, and RA is not called', async () => {
  const denied = NextResponse.json({ message: 'No RA account linked' }, { status: 400 })
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(request('u=Ivan&gameId=42'))).toBe(denied)
  expect(getGameInfoAndUserProgress).not.toHaveBeenCalled()
})

test('400 without a username', async () => {
  expect((await GET(request(''))).status).toBe(400)
  expect(getGameInfoAndUserProgress).not.toHaveBeenCalled()
})

test('400 for a game id that is not a number', async () => {
  expect((await GET(request('u=Ivan&gameId=abc'))).status).toBe(400)
  expect((await GET(request('u=Ivan'))).status).toBe(400)
  expect(getGameInfoAndUserProgress).not.toHaveBeenCalled()
})

test('asks RA with the viewer key, caches per user in any case, and only privately', async () => {
  ;(getGameInfoAndUserProgress as jest.Mock).mockResolvedValue({ ID: 42 })
  const res = await GET(request('u=Ivan&gameId=42'))
  expect(res.status).toBe(200)
  expect(getGameInfoAndUserProgress).toHaveBeenCalledWith('Ivan', 'viewer-key', '42')
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('publicGameProgression_v2:ivan:42')
  expect(res.headers.get('Cache-Control')).toMatch(/^private/)
})

test('only a well-formed answer is cached', () => {
  return GET(request('u=Ivan&gameId=42')).then(() => {
    const isValid = (withCache as jest.Mock).mock.calls[0][3] as (d: unknown) => boolean
    expect(isValid({ ID: 42 })).toBe(true)
    expect(isValid(null)).toBe(false)
    expect(isValid({ error: 'nope' })).toBe(false)
  })
})

test('502 when RA fails', async () => {
  ;(getGameInfoAndUserProgress as jest.Mock).mockRejectedValue(new Error('RA down'))
  expect((await GET(request('u=Ivan&gameId=42'))).status).toBe(502)
})
