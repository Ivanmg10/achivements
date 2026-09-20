jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
})

test('returns 401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await GET()
  expect(res.status).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

test('returns the linked Steam account', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({
    rows: [{ steamid: '76561198000000000', steamusername: 'Ivan' }],
  })
  const res = await GET()
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toEqual({
    steamid: '76561198000000000',
    steamusername: 'Ivan',
  })
})

test('normalises an unlinked account to nulls', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ steamid: null, steamusername: null }] })
  const res = await GET()
  expect((res as unknown as { data: unknown }).data).toEqual({ steamid: null, steamusername: null })
})

test('returns 404 when the user row is gone', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  const res = await GET()
  expect(res.status).toBe(404)
})

test('returns 500 when the query fails', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  const res = await GET()
  expect(res.status).toBe(500)
})
