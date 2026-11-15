jest.mock('@/lib/psnMaintenance', () => ({ runPsnMaintenance: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { runPsnMaintenance } from '@/lib/psnMaintenance'

const call = (authorization = 'Bearer cron-secret') => GET(new NextRequest('http://localhost/api/cron/psn-alerts', { headers: { authorization } }))
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'cron-secret'
})

afterEach(() => delete process.env.CRON_SECRET)

test('refuses without the cron secret', async () => {
  expect((await call('Bearer nope')).status).toBe(401)
  expect(runPsnMaintenance).not.toHaveBeenCalled()
})

test('runs the upkeep and the alerts, and says what it did', async () => {
  ;(runPsnMaintenance as jest.Mock).mockResolvedValue({ canaries: 1, alerts: { PRO: { sent: 0, result: 'nothing' } } })
  expect(data(await call())).toEqual({ canaries: 1, alerts: { PRO: { sent: 0, result: 'nothing' } } })
})

test('a failure is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(runPsnMaintenance as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await call()).status).toBe(500)
  ;(console.error as jest.Mock).mockRestore()
})
