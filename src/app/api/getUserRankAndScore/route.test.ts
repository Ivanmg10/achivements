jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { withCache } from '@/lib/raCache'

beforeEach(() => jest.clearAllMocks())

test('returns 401 when no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await GET()
  expect(res.status).toBe(401)
})

test('returns 400 when no rausername', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1, rausername: null, raid: null } })
  const res = await GET()
  expect(res.status).toBe(400)
})

test('returns 404 when RA response has no Rank field', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1, rausername: 'user', raid: 'key' } })
  ;(withCache as jest.Mock).mockResolvedValue({ Score: 1234, SoftcoreScore: 0 })
  const res = await GET()
  expect(res.status).toBe(404)
})

test('returns 404 when RA response is null', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1, rausername: 'user', raid: 'key' } })
  ;(withCache as jest.Mock).mockResolvedValue(null)
  const res = await GET()
  expect(res.status).toBe(404)
})

test('returns 200 when Rank field present', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1, rausername: 'user', raid: 'key' } })
  ;(withCache as jest.Mock).mockResolvedValue({ Score: 5000, SoftcoreScore: 200, Rank: 42 })
  const res = await GET()
  expect(res.status).toBe(200)
})

test('returns data when Rank is null (unranked user)', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1, rausername: 'user', raid: 'key' } })
  ;(withCache as jest.Mock).mockResolvedValue({ Score: 0, SoftcoreScore: 0, Rank: null })
  const res = await GET()
  expect(res.status).toBe(200)
})
