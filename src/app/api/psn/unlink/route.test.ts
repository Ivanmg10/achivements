jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ clearUserCache: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUser } from '@/lib/userRecord'

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 })
})

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await POST()).status).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

test('clears both PSN columns, the cache and the cached user row', async () => {
  expect((await POST()).status).toBe(200)
  expect(pool.query).toHaveBeenCalledWith(
    'UPDATE users SET psnaccountid = NULL, psnusername = NULL WHERE id = $1',
    ['7'],
  )
  expect(clearUserCache).toHaveBeenCalledWith('7')
  expect(forgetUser).toHaveBeenCalledWith('7')
})

test('500 when the DB write fails, leaving the cache alone', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await POST()).status).toBe(500)
  expect(clearUserCache).not.toHaveBeenCalled()
})
