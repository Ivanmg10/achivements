jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({
  withCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
  clearCache: jest.fn(),
}))
jest.mock('@/lib/fetchRA', () => ({ fetchRA: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { fetchRA } from '@/lib/fetchRA'
import { withCache } from '@/lib/raCache'

const mockSession = { user: { id: '1', rausername: 'user', raid: 'key' } }

beforeEach(() => {
  ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  ;(fetchRA as jest.Mock).mockResolvedValue([{ AchievementID: 1, Title: 'Trophy', Date: '2024-01-01 00:00:00' }])
})

test('GET returns recent achievements', async () => {
  const res = await GET()
  expect(Array.isArray(res.data)).toBe(true)
  expect(res.data[0]).toHaveProperty('AchievementID', 1)
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

// The mock above ignores the validator, which is how an empty list answering
// 503 went unnoticed: run one case with the real behaviour.
test('an empty list is an answer, not a 503 — nothing earned in the window', async () => {
  ;(withCache as jest.Mock).mockImplementationOnce(
    async (_key: string, _ttl: number, fetcher: () => Promise<unknown>, shouldCache?: (d: unknown) => boolean) => {
      const data = await fetcher()
      if (shouldCache && !shouldCache(data)) throw new Error('RA_VALIDATION_FAILED')
      return data
    },
  )
  ;(fetchRA as jest.Mock).mockResolvedValue([])

  const res = await GET()
  expect(res.status).toBe(200)
  expect(res.data).toEqual([])
})
