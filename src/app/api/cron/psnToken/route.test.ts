jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/email', () => ({ sendEmail: jest.fn() }))
jest.mock('@/lib/psnCredentials', () => ({
  ...jest.requireActual('@/lib/psnCredentials'),
  loadPsnCredentials: jest.fn(),
  markPsnWarned: jest.fn(),
  npssoExpiry: jest.fn(),
  savePsnNpsso: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from './route'
import pool from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { loadPsnCredentials, markPsnWarned, npssoExpiry, savePsnNpsso } from '@/lib/psnCredentials'

const DAY = 86_400_000
const call = (authorization = 'Bearer cron-secret') =>
  GET(new NextRequest('http://localhost/api/cron/psnToken', { headers: { authorization } }))
const data = (res: unknown) => (res as { data: Record<string, unknown> }).data
const creds = (days: number, warnedAt: number | null = null) => ({ npsso: 'n', npssoExpiresAt: Date.now() + days * DAY + 1000, warnedAt })

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'cron-secret'
  delete process.env.PSN_NPSSO
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

test('plenty of time left: no mail', async () => {
  ;(loadPsnCredentials as jest.Mock).mockResolvedValue(creds(30))
  expect(data(await call())).toEqual({ daysLeft: 30, warned: false })
  expect(sendEmail).not.toHaveBeenCalled()
})

test('a week or less: every admin is mailed how to renew it, once every two days', async () => {
  ;(loadPsnCredentials as jest.Mock).mockResolvedValue(creds(5))
  expect(data(await call())).toEqual({ daysLeft: 5, warned: true, sent: 2 })
  expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@x.com', subject: expect.stringContaining('5 days') }))
  expect((sendEmail as jest.Mock).mock.calls[0][0].text).toContain('https://ca.account.sony.com/api/v1/ssocookie')
  expect(markPsnWarned).toHaveBeenCalled()

  jest.clearAllMocks()
  ;(loadPsnCredentials as jest.Mock).mockResolvedValue(creds(4, Date.now() - DAY))
  expect(data(await call())).toEqual({ daysLeft: 4, warned: false })
  expect(sendEmail).not.toHaveBeenCalled()
})

test('a mail that could not be sent is tried again tomorrow', async () => {
  ;(loadPsnCredentials as jest.Mock).mockResolvedValue(creds(2))
  ;(sendEmail as jest.Mock).mockResolvedValue('failed')
  expect(data(await call())).toMatchObject({ warned: false, sent: 0 })
  expect(markPsnWarned).not.toHaveBeenCalled()
})

test('an NPSSO only in the environment is stored with its expiry, so it can be watched', async () => {
  process.env.PSN_NPSSO = 'env-npsso'
  const expires = Date.now() + 50 * DAY
  ;(npssoExpiry as jest.Mock).mockResolvedValue(expires)
  ;(loadPsnCredentials as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(creds(50))
  await call()
  expect(savePsnNpsso).toHaveBeenCalledWith('env-npsso', expires, 'PSN_NPSSO')
})

test('nothing set up: nothing to watch', async () => {
  ;(loadPsnCredentials as jest.Mock).mockResolvedValue(null)
  expect(data(await call())).toEqual({ configured: false })
})
