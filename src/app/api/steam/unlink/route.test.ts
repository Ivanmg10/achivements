jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 })
})

test('returns 401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await POST()
  expect(res.status).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

test('clears both Steam columns for the signed-in user', async () => {
  const res = await POST()
  expect(res.status).toBe(200)
  expect(pool.query).toHaveBeenCalledWith(
    'UPDATE users SET steamid = NULL, steamusername = NULL WHERE id = $1',
    ['7'],
  )
})

test('returns 500 when the DB write fails', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  const res = await POST()
  expect(res.status).toBe(500)
})
