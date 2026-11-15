jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/email', () => ({ sendEmail: jest.fn() }))
jest.mock('@/lib/psnAccounts', () => ({ ...jest.requireActual('@/lib/psnAccounts'), listPsnAccounts: jest.fn(), markPsnWarned: jest.fn() }))
jest.mock('@/lib/psnPool', () => ({ psnPoolConfigured: jest.fn(async () => true) }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import pool from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { listPsnAccounts, markPsnWarned } from '@/lib/psnAccounts'
import { psnPoolConfigured } from '@/lib/psnPool'
import { DAY_MS, psnAccount } from '@/test-utils/psnPoolFixtures'

const call = (authorization = 'Bearer cron-secret') =>
  GET(new NextRequest('http://localhost/api/cron/psnToken', { headers: { authorization } }))
const data = (res: unknown) => (res as { data: Record<string, unknown> }).data
const expiring = (days: number, over = {}) => psnAccount({ npssoExpiresAt: Date.now() + days * DAY_MS + 1000, ...over })

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'cron-secret'
  delete process.env.TELEGRAM_BOT_TOKEN
  delete process.env.TELEGRAM_CHAT_ID
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ email: 'admin@x.com' }, { email: 'other@x.com' }] })
  ;(sendEmail as jest.Mock).mockResolvedValue('sent')
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  delete process.env.CRON_SECRET
  ;(console.error as jest.Mock).mockRestore()
})

test('refuses without the cron secret', async () => {
  expect((await call('Bearer nope')).status).toBe(401)
  delete process.env.CRON_SECRET
  expect((await call()).status).toBe(503)
})

test('does nothing when Telegram tells the owner instead', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 't'
  process.env.TELEGRAM_CHAT_ID = 'c'
  expect(data(await call())).toEqual({ skipped: 'telegram' })
  expect(listPsnAccounts).not.toHaveBeenCalled()
})

test('no account set up: nothing to warn about', async () => {
  ;(psnPoolConfigured as jest.Mock).mockResolvedValueOnce(false)
  expect(data(await call())).toEqual({ configured: false })
})

test('plenty of time left: no mail', async () => {
  ;(listPsnAccounts as jest.Mock).mockResolvedValue([expiring(30)])
  expect(data(await call())).toEqual({ warned: false })
  expect(sendEmail).not.toHaveBeenCalled()
})

test('a week or less: every admin is mailed which account and how to renew it, once every two days', async () => {
  ;(listPsnAccounts as jest.Mock).mockResolvedValue([expiring(5), expiring(30, { id: 2, label: 'PSN-2' })])
  expect(data(await call())).toEqual({ warned: true, sent: 2, accounts: ['PSN-1'] })
  const mail = (sendEmail as jest.Mock).mock.calls[0][0]
  expect(mail).toMatchObject({ to: 'admin@x.com', subject: expect.stringContaining('PSN-1') })
  expect(mail.text).toContain('PSN-1: expires in 5 days')
  expect(mail.text).toContain('https://ca.account.sony.com/api/v1/ssocookie')
  expect(markPsnWarned).toHaveBeenCalledWith([1])

  jest.clearAllMocks()
  ;(listPsnAccounts as jest.Mock).mockResolvedValue([expiring(4, { warnedAt: Date.now() - DAY_MS })])
  expect(data(await call())).toEqual({ warned: false })
})

test('several accounts in one mail; an expired one says so; a paused one is left alone', async () => {
  ;(listPsnAccounts as jest.Mock).mockResolvedValue([expiring(0), expiring(2, { id: 2, label: 'PSN-2' }), expiring(1, { id: 3, label: 'PSN-3', status: 'paused' })])
  await call()
  const mail = (sendEmail as jest.Mock).mock.calls[0][0]
  expect(mail.subject).toContain('2 PSN sign-ins')
  expect(mail.text).toContain('PSN-1: expired.')
  expect(mail.text).not.toContain('PSN-3')
})

test('no mail sent: not marked, so it is tried again tomorrow', async () => {
  ;(listPsnAccounts as jest.Mock).mockResolvedValue([expiring(3)])
  ;(sendEmail as jest.Mock).mockResolvedValue('not-configured')
  expect(data(await call())).toMatchObject({ warned: false, sent: 0 })
  expect(markPsnWarned).not.toHaveBeenCalled()
})

test('a database failure is a 500', async () => {
  ;(listPsnAccounts as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await call()).status).toBe(500)
})
