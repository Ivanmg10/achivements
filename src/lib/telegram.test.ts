/** @jest-environment node */
import { escapeTelegram, sendTelegram, telegramConfigured } from './telegram'

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
  process.env.TELEGRAM_BOT_TOKEN = '123:secret'
  process.env.TELEGRAM_CHAT_ID = '42'
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  delete process.env.TELEGRAM_BOT_TOKEN
  delete process.env.TELEGRAM_CHAT_ID
  ;(console.error as jest.Mock).mockRestore()
})

test('configured only with both the bot token and the chat id', () => {
  expect(telegramConfigured()).toBe(true)
  delete process.env.TELEGRAM_CHAT_ID
  expect(telegramConfigured()).toBe(false)
})

test('escapes what Telegram reads as HTML', () => {
  expect(escapeTelegram('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d')
})

test('sends to the chat with sendMessage, escaped, and nothing else', async () => {
  fetchMock.mockResolvedValue({ ok: true })
  expect(await sendTelegram('PSN-1 <ok>')).toBe('sent')
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.telegram.org/bot123:secret/sendMessage')
  expect(JSON.parse(init.body)).toMatchObject({ chat_id: '42', text: 'PSN-1 &lt;ok&gt;', parse_mode: 'HTML' })
  // Send-only: the bot's updates belong to the owner's agent.
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('not configured: nothing is sent', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN
  expect(await sendTelegram('x')).toBe('not-configured')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('a refusal or no answer is a failure, never thrown, and the token is not logged', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false, status: 401 })
  expect(await sendTelegram('x')).toBe('failed')
  fetchMock.mockRejectedValueOnce(new TypeError('fetch failed https://api.telegram.org/bot123:secret'))
  expect(await sendTelegram('x')).toBe('failed')
  expect(JSON.stringify((console.error as jest.Mock).mock.calls)).not.toContain('secret')
})
