jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))
jest.mock('@/lib/passwordReset', () => ({ claimToken: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { POST } from './route'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'
import { claimToken } from '@/lib/passwordReset'
import { forgetUser } from '@/lib/userRecord'

const request = (body: unknown) =>
  new NextRequest('http://localhost/api/auth/resetPassword', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

beforeEach(() => {
  jest.clearAllMocks()
  ;(claimToken as jest.Mock).mockResolvedValue(3)
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

test('spends the token, sets the new password and drops the cached user', async () => {
  const res = await POST(request({ token: 'tok', password: 'secret12' }))
  expect(res.status).toBe(200)
  expect(claimToken).toHaveBeenCalledWith('tok')
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET password'), ['hashed', 3])
  expect(forgetUser).toHaveBeenCalledWith(3)
})

test('a stale, spent or made-up token changes nothing', async () => {
  ;(claimToken as jest.Mock).mockResolvedValue(null)
  const res = await POST(request({ token: 'tok', password: 'secret12' }))
  expect(res.status).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('the new password still has to meet the rule', async () => {
  const res = await POST(request({ token: 'tok', password: '1234567' }))
  expect(res.status).toBe(400)
  expect(claimToken).not.toHaveBeenCalled()
  expect(pool.query).not.toHaveBeenCalled()
})

test('both the token and a password are required', async () => {
  expect((await POST(request({ token: 'tok' }))).status).toBe(400)
  expect((await POST(request({ password: 'secret12' }))).status).toBe(400)
})

test('a database error is a 500, not a crash', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await POST(request({ token: 'tok', password: 'secret12' }))).status).toBe(500)
})
