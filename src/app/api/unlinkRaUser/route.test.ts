jest.mock('@/lib/db', () => {
  const query = jest.fn()
  return { __esModule: true, default: { query } }
})

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'

beforeEach(() => {
  ;(pool.query as jest.Mock).mockResolvedValue({})
})

test('returns 401 when no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await POST()
  expect(res.status).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

test('clears raUser, rausername, and raid in DB', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
  const res = await POST()
  expect(res.status).toBe(200)
  expect(pool.query as jest.Mock).toHaveBeenCalledWith(
    expect.stringContaining('rausername = NULL'),
    [1],
  )
  expect(pool.query as jest.Mock).toHaveBeenCalledWith(
    expect.stringContaining('raid = NULL'),
    [1],
  )
})
