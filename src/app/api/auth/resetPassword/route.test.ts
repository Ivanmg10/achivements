jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))
jest.mock('@/lib/passwordReset', () => ({ userForToken: jest.fn(), consumeToken: jest.fn() }))

import { POST } from './route'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'
import { consumeToken, userForToken } from '@/lib/passwordReset'

const request = (body: unknown) =>
  new NextRequest('http://localhost/api/auth/resetPassword', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

beforeEach(() => {
  jest.clearAllMocks()
  ;(userForToken as jest.Mock).mockResolvedValue(3)
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

test('sets the new password and spends the token', async () => {
  const res = await POST(request({ token: 'tok', password: 'secret1' }))
  expect(res.status).toBe(200)
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET password'), ['hashed', 3])
  expect(consumeToken).toHaveBeenCalledWith('tok')
})

test('a stale, spent or made-up token changes nothing', async () => {
  ;(userForToken as jest.Mock).mockResolvedValue(null)
  const res = await POST(request({ token: 'tok', password: 'secret1' }))
  expect(res.status).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('the new password still has to meet the rule', async () => {
  const res = await POST(request({ token: 'tok', password: '12345' }))
  expect(res.status).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('both the token and a password are required', async () => {
  expect((await POST(request({ token: 'tok' }))).status).toBe(400)
  expect((await POST(request({ password: 'secret1' }))).status).toBe(400)
})

test('a database error is a 500, not a crash', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await POST(request({ token: 'tok', password: 'secret1' }))).status).toBe(500)
})
