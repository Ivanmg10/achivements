jest.mock('@/lib/email', () => ({ ...jest.requireActual('@/lib/email'), emailConfigured: jest.fn(), sendEmail: jest.fn() }))
jest.mock('@/lib/siteUrl', () => ({ CONTACT_EMAIL: 'privacy@test.com' }))

import { sendSteamLinkNotice } from './steamLinkNotice'
import { emailConfigured, sendEmail } from '@/lib/email'

const mail = () => (sendEmail as jest.Mock).mock.calls[0][0]

beforeEach(() => {
  jest.clearAllMocks()
  ;(emailConfigured as jest.Mock).mockReturnValue(true)
  ;(sendEmail as jest.Mock).mockResolvedValue('sent')
})

test('a link tells the owner that Steam can sign in, and how to undo it', async () => {
  await sendSteamLinkNotice({ to: 'ana@test.com', username: 'ana', linked: true })
  expect(mail().to).toBe('ana@test.com')
  expect(mail().text).toContain('can now sign in')
  expect(mail().text).toContain('unlink Steam')
})

test('an unlink says the sign-in is gone', async () => {
  await sendSteamLinkNotice({ to: 'ana@test.com', username: 'ana', linked: false })
  expect(mail().text).toContain('can no longer sign in')
})

test('with no mail set up it sends nothing, and a failure never reaches the caller', async () => {
  ;(emailConfigured as jest.Mock).mockReturnValue(false)
  await sendSteamLinkNotice({ to: 'ana@test.com', username: 'ana', linked: true })
  expect(sendEmail).not.toHaveBeenCalled()
  ;(emailConfigured as jest.Mock).mockReturnValue(true)
  ;(sendEmail as jest.Mock).mockRejectedValue(new Error('down'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
  await expect(sendSteamLinkNotice({ to: 'ana@test.com', username: 'ana', linked: true })).resolves.toBeUndefined()
})
