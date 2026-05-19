jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/fetchRA', () => ({ fetchRA: jest.fn() }))
jest.mock('@/lib/raCache', () => ({
  withCache: jest.fn(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>, shouldCache?: (d: unknown) => boolean) => {
    const data = await fetcher()
    if (shouldCache && !shouldCache(data)) throw Object.assign(new Error('RA_VALIDATION_FAILED'), { code: 'RA_VALIDATION_FAILED' })
    return data
  }),
  clearCache: jest.fn(),
}))

import { GET } from './route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { fetchRA } from '@/lib/fetchRA'

const mockSession = { user: { id: '1', rausername: 'user', raid: 'key' } }

beforeEach(() => {
  ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  ;(fetchRA as jest.Mock).mockResolvedValue({ ID: 1, Title: 'Test Game', UserCompletion: '50%' })
})

test('GET returns game progression', async () => {
  const req = new NextRequest('http://localhost/api/getGameProgression?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(200)
  expect((res as any).data).toHaveProperty('UserCompletion')
})

test('GET returns 401 when no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const req = new NextRequest('http://localhost/api/getGameProgression?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(401)
})

test('GET returns 400 when no gameId', async () => {
  const req = new NextRequest('http://localhost/api/getGameProgression')
  const res = await GET(req)
  expect(res.status).toBe(400)
})

test('GET returns 400 when no RA account', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  const req = new NextRequest('http://localhost/api/getGameProgression?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(400)
})

test('GET returns 503 when fetchRA throws', async () => {
  ;(fetchRA as jest.Mock).mockRejectedValueOnce(new Error('RA API error 500'))
  const req = new NextRequest('http://localhost/api/getGameProgression?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(503)
})

test('GET returns 503 when RA returns no ID field', async () => {
  ;(fetchRA as jest.Mock).mockResolvedValueOnce({ Title: 'No ID' })
  const req = new NextRequest('http://localhost/api/getGameProgression?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(503)
})
