jest.mock('@/lib/raCache', () => ({
  withCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
  clearCache: jest.fn(),
}))

import { GET } from './route'
import { NextRequest } from 'next/server'

global.fetch = jest.fn()

beforeEach(() => {
  process.env.RA_API_KEY = 'testkey'
  ;(fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({ ID: 1, Title: 'Test Game' }),
  })
})

test('GET returns game data', async () => {
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  const res = await GET(req)
  expect(res.data).toHaveProperty('ID', 1)
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

test('GET returns 502 on fetch error', async () => {
  ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'))
  const req = new NextRequest('http://localhost/api/getGameData?gameId=123')
  const res = await GET(req)
  expect(res.status).toBe(502)
})
