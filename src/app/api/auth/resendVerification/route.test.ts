jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/userRecord', () => ({ loadUser: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({
  allowAttempt: jest.fn(),
  clientAddress: jest.fn(() => '1.1.1.1'),
}))
jest.mock('@/lib/email', () => ({ emailConfigured: jest.fn() }))
jest.mock('@/lib/verificationEmail', () => ({ sendVerificationEmail: jest.fn() }))

import { POST } from './route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { loadUser } from '@/lib/userRecord'
import { allowAttempt } from '@/lib/attemptLimit'
import { emailConfigured } from '@/lib/email'
import { sendVerificationEmail } from '@/lib/verificationEmail'

const request = () => new NextRequest('https://www.cheevovault.com/api/auth/resendVerification', { method: 'POST' })

const body = async (res: Response) => (res as unknown as { data: Record<string, unknown> }).data

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  ;(emailConfigured as jest.Mock).mockReturnValue(true)
  ;(loadUser as jest.Mock).mockResolvedValue({
    id: 7, username: 'ivan', email: 'ivan@test.com', email_verified_at: null,
  })
})

test('mails the address on the account, never one from the request', async () => {
  const res = await POST(request())

  expect(res.status).toBe(200)
  expect(sendVerificationEmail).toHaveBeenCalledWith(7, 'ivan', 'ivan@test.com')
})

test('a signed-out visitor gets nothing', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await POST(request())).status).toBe(401)
  expect(sendVerificationEmail).not.toHaveBeenCalled()
})

test('says so plainly when email is not set up, rather than pretending', async () => {
  ;(emailConfigured as jest.Mock).mockReturnValue(false)
  const res = await POST(request())

  expect(res.status).toBe(503)
  expect(await body(res)).toEqual({ error: 'email-not-configured' })
})

test('is rate limited, like the other things that send mail', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(false)
  expect((await POST(request())).status).toBe(429)
  expect(sendVerificationEmail).not.toHaveBeenCalled()
})

test('an account with no address has nothing to confirm', async () => {
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 7, username: 'ivan', email: null })
  expect((await POST(request())).status).toBe(400)
})

test('an address already confirmed costs no second email', async () => {
  ;(loadUser as jest.Mock).mockResolvedValue({
    id: 7, username: 'ivan', email: 'ivan@test.com', email_verified_at: '2026-09-28',
  })
  const res = await POST(request())

  expect(await body(res)).toEqual({ ok: true, alreadyVerified: true })
  expect(sendVerificationEmail).not.toHaveBeenCalled()
})
