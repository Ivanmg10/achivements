jest.mock('@/lib/raCache', () => ({ withCache: jest.fn(), clearCache: jest.fn() }))
jest.mock('@/lib/fetchRA', () => ({ fetchRA: jest.fn() }))
jest.mock('@/lib/apiAuth', () => ({ requireViewerApiKey: jest.fn() }))

import { GET } from './route'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { NextResponse } from 'next/server'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.RA_API_KEY = 'testkey'
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: true, viewerId: '1', apiKey: 'viewerkey' })
  ;(withCache as jest.Mock).mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>, shouldCache?: (d: unknown) => boolean) => {
    const data = await fetcher()
    if (shouldCache && !shouldCache(data)) throw Object.assign(new Error('RA_VALIDATION_FAILED'), { code: 'RA_VALIDATION_FAILED' })
    return data
  })
  ;(fetchRA as jest.Mock).mockResolvedValue({ ID: 1, Title: 'Test Game' })
})

test('GET returns game data', async () => {
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  const res = await GET(req)
  expect((res as unknown as { data: unknown }).data).toHaveProperty('ID', 1)
})

test('GET sets a private Cache-Control header matching the cache TTL', async () => {
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  const res = await GET(req)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=14400')
})

test('GET returns 400 when no gameId', async () => {
  const req = new NextRequest('http://localhost/api/getGameData')
  const res = await GET(req)
  expect(res.status).toBe(400)
})

test('GET returns 400 when gameId is not numeric', async () => {
  const req = new NextRequest('http://localhost/api/getGameData?gameId=abc')
  const res = await GET(req)
  expect(res.status).toBe(400)
})

test('GET returns 503 when fetchRA throws', async () => {
  ;(fetchRA as jest.Mock).mockRejectedValueOnce(new Error('RA API error 500'))
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(503)
})

test('GET returns 503 when RA returns no ID field', async () => {
  ;(fetchRA as jest.Mock).mockResolvedValueOnce({ Title: 'No ID' })
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(503)
})

test('GET asks RA with the viewer own key, not the shared one', async () => {
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  await GET(req)
  expect(fetchRA).toHaveBeenCalledWith(expect.stringContaining('y=viewerkey'))
})

test('GET hands back whatever the key check refuses with, without calling RA', async () => {
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({
    ok: false,
    response: NextResponse.json({ message: 'No RA API key configured' }, { status: 503 }),
  })
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(503)
  expect(fetchRA).not.toHaveBeenCalled()
})
