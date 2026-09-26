import { emailConfigured, sendEmail } from './email'

const message = { to: 'a@b.c', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' }

beforeEach(() => {
  jest.clearAllMocks()
  process.env.RESEND_API_KEY = 're_test'
  process.env.EMAIL_FROM = 'CheevoVault <no-reply@example.com>'
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

afterEach(() => {
  delete process.env.RESEND_API_KEY
  delete process.env.EMAIL_FROM
})

test('says nothing is configured until both the key and the sender are set', () => {
  expect(emailConfigured()).toBe(true)
  delete process.env.EMAIL_FROM
  expect(emailConfigured()).toBe(false)
  delete process.env.RESEND_API_KEY
  expect(emailConfigured()).toBe(false)
})

test('without configuration it reports that, and sends nothing', async () => {
  delete process.env.RESEND_API_KEY
  await expect(sendEmail(message)).resolves.toBe('not-configured')
  expect(global.fetch).not.toHaveBeenCalled()
})

test('posts the message to Resend with the configured sender', async () => {
  await expect(sendEmail(message)).resolves.toBe('sent')
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('https://api.resend.com/emails')
  expect(init.headers.Authorization).toBe('Bearer re_test')
  expect(JSON.parse(init.body)).toMatchObject({
    from: 'CheevoVault <no-reply@example.com>',
    to: ['a@b.c'],
    subject: 'Hi',
  })
})

test('a refusal from Resend — an unverified domain, say — is reported', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status: 403,
    text: () => Promise.resolve('domain is not verified'),
  })
  await expect(sendEmail(message)).resolves.toBe('failed')
})

test('a network failure is reported rather than thrown', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  await expect(sendEmail(message)).resolves.toBe('failed')
})
