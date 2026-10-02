jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { forgetUser } from '@/lib/userRecord'

const request = (body: unknown) => ({ json: () => Promise.resolve(body) }) as unknown as Request

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

test('saves a known theme and drops the cached user', async () => {
  const res = await POST(request({ theme: 'blue' }))
  expect(res.status).toBe(200)
  expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['blue', '1'])
  expect(forgetUser).toHaveBeenCalledWith('1')
})

test('refuses a theme the app does not have', async () => {
  expect((await POST(request({ theme: 'yellow' }))).status).toBe(400)
  expect((await POST(request({ theme: '<script>' }))).status).toBe(400)
  expect((await POST(request({}))).status).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('401 without a session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await POST(request({ theme: 'dark' }))).status).toBe(401)
})

test('500 when the database fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await POST(request({ theme: 'dark' }))).status).toBe(500)
})
