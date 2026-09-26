jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/attemptLimit', () => ({
  clientAddress: () => '1.2.3.4',
  allowAttempt: jest.fn(),
}))
jest.mock('@/lib/email', () => ({ emailConfigured: jest.fn(), sendEmail: jest.fn() }))
jest.mock('@/lib/passwordReset', () => ({
  createResetToken: jest.fn().mockResolvedValue('tok'),
  resetUrl: (t: string) => `https://app/resetPassword?token=${t}`,
}))

import { POST } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt } from '@/lib/attemptLimit'
import { emailConfigured, sendEmail } from '@/lib/email'
import { createResetToken } from '@/lib/passwordReset'

const request = (body: unknown) =>
  new NextRequest('http://localhost/api/auth/forgotPassword', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

beforeEach(() => {
  jest.clearAllMocks()
  ;(emailConfigured as jest.Mock).mockReturnValue(true)
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  ;(sendEmail as jest.Mock).mockResolvedValue('sent')
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 3, username: 'ivan' }] })
})

test('sends a link to an address that has an account', async () => {
  const res = await POST(request({ email: 'ivan@test.com' }))
  expect(res.status).toBe(200)
  expect(createResetToken).toHaveBeenCalledWith(3)
  const [message] = (sendEmail as jest.Mock).mock.calls[0]
  expect(message.to).toBe('ivan@test.com')
  expect(message.text).toContain('https://app/resetPassword?token=tok')
})

test('an unknown address gets the same answer, so accounts cannot be probed', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  const res = await POST(request({ email: 'nobody@test.com' }))
  expect(res.status).toBe(200)
  expect(sendEmail).not.toHaveBeenCalled()
})

test('says so plainly when email is not set up, rather than promising a message', async () => {
  ;(emailConfigured as jest.Mock).mockReturnValue(false)
  const res = await POST(request({ email: 'ivan@test.com' }))
  expect(res.status).toBe(503)
  expect(sendEmail).not.toHaveBeenCalled()
})

test('too many requests from one address are refused', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(false)
  expect((await POST(request({ email: 'ivan@test.com' }))).status).toBe(429)
})

test('an address is required', async () => {
  expect((await POST(request({}))).status).toBe(400)
})

test('a database error is a 500, not a crash', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await POST(request({ email: 'ivan@test.com' }))).status).toBe(500)
})
