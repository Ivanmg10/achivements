jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({
  withCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
  clearCache: jest.fn(),
}))
jest.mock('@/lib/fetchRA', () => ({ fetchRA: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { fetchRA } from '@/lib/fetchRA'

const mockSession = { user: { id: '1', rausername: 'user', raid: 'key' } }

beforeEach(() => {
  ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  ;(fetchRA as jest.Mock).mockResolvedValue([{ GameID: 1, Title: 'Game' }])
})

test('GET returns completed games', async () => {
  const res = await GET()
  expect(res.data).toEqual([{ GameID: 1, Title: 'Game' }])
})

test('GET returns 401 when no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await GET()
  expect(res.status).toBe(401)
})

test('GET returns empty when no rausername', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  const res = await GET()
  expect(res.data).toEqual([])
})

test('GET returns 503 on fetchRA error', async () => {
  ;(fetchRA as jest.Mock).mockRejectedValueOnce(new Error('fail'))
  const res = await GET()
  expect(res.status).toBe(503)
})
