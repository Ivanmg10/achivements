jest.mock('@/lib/rankings', () => ({ takeWeeklySnapshot: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ refreshDueScores: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { takeWeeklySnapshot } from '@/lib/rankings'
import { refreshDueScores } from '@/lib/scoreRefresh'

const call = (auth?: string) =>
  GET(new NextRequest('http://x/api/cron/scores', { headers: auth ? { authorization: auth } : {} }) as never) as unknown as Promise<{ status: number; data: unknown }>

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'shh'
  ;(takeWeeklySnapshot as jest.Mock).mockResolvedValue(true)
  ;(refreshDueScores as jest.Mock).mockResolvedValue(4)
})

afterAll(() => {
  delete process.env.CRON_SECRET
})

test('takes the week snapshot, then refreshes who is due', async () => {
  const res = await call('Bearer shh')
  expect(res.status).toBe(200)
  expect(res.data).toEqual({ snapshot: true, refreshed: 4 })
  expect(refreshDueScores).toHaveBeenCalledWith(expect.any(Number))
})

test('refuses without the secret, and runs nowhere without one set', async () => {
  expect((await call('Bearer nope')).status).toBe(401)
  expect((await call()).status).toBe(401)
  delete process.env.CRON_SECRET
  expect((await call('Bearer shh')).status).toBe(503)
  expect(refreshDueScores).not.toHaveBeenCalled()
})

test('a failure is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(takeWeeklySnapshot as jest.Mock).mockRejectedValue(new Error('db'))
  expect((await call('Bearer shh')).status).toBe(500)
})
