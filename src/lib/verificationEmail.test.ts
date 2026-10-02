jest.mock('@/lib/email', () => ({ emailConfigured: jest.fn(), sendEmail: jest.fn() }))

import { sendVerificationEmail } from './verificationEmail'
import { emailConfigured, sendEmail } from '@/lib/email'
import { readVerification } from '@/lib/emailVerification'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'https://www.cheevovault.com'
  ;(emailConfigured as jest.Mock).mockReturnValue(true)
  ;(sendEmail as jest.Mock).mockResolvedValue('sent')
})

test('mails a signed link for that user and address', async () => {
  await sendVerificationEmail(7, 'ivan', 'ivan@test.com')
  const mail = (sendEmail as jest.Mock).mock.calls[0][0]
  expect(mail.to).toBe('ivan@test.com')
  expect(mail.text).toContain('Hi ivan')

  const link = new URL(mail.text.match(/https:\/\/\S+/)[0])
  expect(link.origin + link.pathname).toBe('https://www.cheevovault.com/api/auth/verifyEmail')
  expect(readVerification(link.searchParams.get('token'))).toEqual({ userId: '7', email: 'ivan@test.com' })
})

test('without email set up, nothing is sent', async () => {
  ;(emailConfigured as jest.Mock).mockReturnValue(false)
  await sendVerificationEmail(7, 'ivan', 'ivan@test.com')
  expect(sendEmail).not.toHaveBeenCalled()
})

test('never throws: an account must not fail over a mail', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(sendEmail as jest.Mock).mockRejectedValue(new Error('Resend down'))
  await expect(sendVerificationEmail(7, 'ivan', 'ivan@test.com')).resolves.toBeUndefined()
})
