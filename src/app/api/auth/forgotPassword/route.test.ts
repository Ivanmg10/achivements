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
import { NextRequest, after } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt } from '@/lib/attemptLimit'
import { emailConfigured, sendEmail } from '@/lib/email'
import { createResetToken } from '@/lib/passwordReset'

const pending = (after as unknown as { pending: Promise<unknown>[] }).pending

const request = (body: unknown) =>
  new NextRequest('http://localhost/api/auth/forgotPassword', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

/** The response, then whatever the route left to run after it. */
async function post(body: unknown) {
  const res = await POST(request(body))
  await Promise.all(pending.splice(0))
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(emailConfigured as jest.Mock).mockReturnValue(true)
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  ;(sendEmail as jest.Mock).mockResolvedValue('sent')
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 3, username: 'ivan', email: 'ivan@test.com' }] })
})

test('sends a link to an address that has an account', async () => {
  const res = await post({ email: 'ivan@test.com' })
  expect(res.status).toBe(200)
  expect(createResetToken).toHaveBeenCalledWith(3)
  const [message] = (sendEmail as jest.Mock).mock.calls[0]
  expect(message.to).toBe('ivan@test.com')
  expect(message.text).toContain('https://app/resetPassword?token=tok')
})

test('mails the stored address, not the variant that was typed', async () => {
  await post({ email: 'IVAN@test.com' })
  expect((sendEmail as jest.Mock).mock.calls[0][0].to).toBe('ivan@test.com')
})

test('answers before looking anything up, so the timing does not tell who is registered', async () => {
  const res = await POST(request({ email: 'ivan@test.com' }))
  expect(res.status).toBe(200)
  expect(pending).toHaveLength(1)
  await Promise.all(pending.splice(0))
})

test('an unknown address gets the same answer, so accounts cannot be probed', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  const res = await post({ email: 'nobody@test.com' })
  expect(res.status).toBe(200)
  expect(res.data).toEqual({ ok: true })
  expect(sendEmail).not.toHaveBeenCalled()
})

test('says so plainly when email is not set up, rather than promising a message', async () => {
  ;(emailConfigured as jest.Mock).mockReturnValue(false)
  const res = await post({ email: 'ivan@test.com' })
  expect(res.status).toBe(503)
  expect(sendEmail).not.toHaveBeenCalled()
})

test('too many requests from one address are refused', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(false)
  expect((await post({ email: 'ivan@test.com' })).status).toBe(429)
})

test('an address is required', async () => {
  expect((await post({})).status).toBe(400)
})

test('a failure behind the scenes is logged, and the answer is still the same', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  const res = await post({ email: 'ivan@test.com' })
  expect(res.status).toBe(200)
  expect(console.error).toHaveBeenCalled()
})
