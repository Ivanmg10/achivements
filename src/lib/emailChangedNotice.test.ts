jest.mock('@/lib/email', () => ({ emailConfigured: jest.fn(), sendEmail: jest.fn() }))
jest.mock('@/lib/siteUrl', () => ({ CONTACT_EMAIL: 'privacy@test.com' }))

import { maskEmail, sendEmailChangedNotice } from './emailChangedNotice'
import { emailConfigured, sendEmail } from '@/lib/email'

beforeEach(() => {
  jest.clearAllMocks()
  ;(emailConfigured as jest.Mock).mockReturnValue(true)
  ;(sendEmail as jest.Mock).mockResolvedValue('sent')
})

test('masks all but the first letter and the domain', () => {
  expect(maskEmail('ivan@test.com')).toBe('i***@test.com')
  expect(maskEmail('nope')).toBe('***')
})

test('tells the old address, with the new one masked and who changed it', async () => {
  await sendEmailChangedNotice({ to: 'old@test.com', username: 'ivan', newEmail: 'new@evil.com', byAdmin: true })
  const mail = (sendEmail as jest.Mock).mock.calls[0][0]
  expect(mail.to).toBe('old@test.com')
  expect(mail.text).toContain('An administrator changed')
  expect(mail.text).toContain('n***@evil.com')
  expect(mail.text).not.toContain('new@evil.com')
  expect(mail.text).toContain('privacy@test.com')
})

test('says "someone" when it was not an admin', async () => {
  await sendEmailChangedNotice({ to: 'old@test.com', username: 'ivan', newEmail: 'new@test.com', byAdmin: false })
  expect((sendEmail as jest.Mock).mock.calls[0][0].text).toContain('Someone changed')
})

test('without email set up, nothing is sent', async () => {
  ;(emailConfigured as jest.Mock).mockReturnValue(false)
  await sendEmailChangedNotice({ to: 'old@test.com', username: 'ivan', newEmail: 'new@test.com', byAdmin: false })
  expect(sendEmail).not.toHaveBeenCalled()
})

test('never throws', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(sendEmail as jest.Mock).mockRejectedValue(new Error('Resend down'))
  await expect(
    sendEmailChangedNotice({ to: 'old@test.com', username: 'ivan', newEmail: 'new@test.com', byAdmin: false }),
  ).resolves.toBeUndefined()
})
