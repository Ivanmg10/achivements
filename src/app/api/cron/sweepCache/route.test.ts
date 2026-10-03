jest.mock('@/lib/steamCache', () => ({ sweepExpired: jest.fn() }))

import { GET } from './route'
import { NextRequest } from 'next/server'
import { sweepExpired } from '@/lib/steamCache'

function call(authorization?: string) {
  return GET(new NextRequest('http://localhost/api/cron/sweepCache', {
    headers: authorization ? { authorization } : {},
  }))
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'cron-secret'
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  delete process.env.CRON_SECRET
  ;(console.error as jest.Mock).mockRestore()
})

test('sweeps and reports how many rows went', async () => {
  ;(sweepExpired as jest.Mock).mockResolvedValue(42)
  const res = await call('Bearer cron-secret')
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toEqual({ deleted: 42 })
})

test('refuses a missing or wrong secret without touching the table', async () => {
  expect((await call()).status).toBe(401)
  expect((await call('Bearer nope')).status).toBe(401)
  expect(sweepExpired).not.toHaveBeenCalled()
})

test('refuses everyone when CRON_SECRET is unset', async () => {
  delete process.env.CRON_SECRET
  expect((await call('Bearer ')).status).toBe(503)
  expect(sweepExpired).not.toHaveBeenCalled()
})

test('a database failure is a 500, so the cron run shows as failed', async () => {
  ;(sweepExpired as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await call('Bearer cron-secret')).status).toBe(500)
})
