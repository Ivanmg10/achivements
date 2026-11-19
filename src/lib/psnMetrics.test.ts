/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { after } from 'next/server'
import { psnMetrics, timedPsnRead } from './psnMetrics'

const query = pool.query as jest.Mock
const pending = () => Promise.all((after as unknown as { pending: Promise<unknown>[] }).pending)

beforeEach(() => {
  jest.clearAllMocks()
  query.mockResolvedValue({ rows: [] })
})

test('a timed read records its time and whether the store answered; an error is not timed', async () => {
  const ok = timedPsnRead(async () => new Response('{}', { status: 200 }))
  const waiting = timedPsnRead(async () => new Response('{}', { status: 202 }))
  const failed = timedPsnRead(async () => new Response('{}', { status: 502 }))
  expect((await ok()).status).toBe(200)
  await waiting()
  await failed()
  await pending()
  expect(query).toHaveBeenCalledTimes(2)
  expect(query.mock.calls.map((c) => c[1][1])).toEqual([true, false])
  expect(String(query.mock.calls[0][0])).toContain("INSERT INTO psn_timings (kind, ms, ok) VALUES ('read'")
})

test('the numbers: per account by function, refusals, p95s, reads served, the queue', async () => {
  query
    .mockResolvedValueOnce({ rows: [{ account_id: 1, calls: 120, rate_limited: 3, auth_errors: 1, forbidden: 2, server_errors: 0 }] })
    .mockResolvedValueOnce({ rows: [{ account_id: 1, fn: 'titles', calls: 100 }, { account_id: 1, fn: 'summary', calls: 20 }] })
    .mockResolvedValueOnce({
      rows: [
        { account_id: 1, kind: 'sony', p95: '412.6', n: 120, ok: 0 },
        { account_id: null, kind: 'sony-all', p95: 412.6, n: 120, ok: 0 },
        { account_id: null, kind: 'read', p95: '88', n: 40, ok: '92.5' },
      ],
    })
    .mockResolvedValueOnce({ rows: [{ calls: 10, rate_limited: 1 }] })
    .mockResolvedValueOnce({ rows: [{ due: 4, queued: 9, running: 1, lag_p95: '61000.4', lag_n: 30 }] })
  expect(await psnMetrics()).toEqual({
    accounts: [
      { accountId: 1, calls: 120, callsPerMin: 2, byFn: { titles: 100, summary: 20 }, rateLimited: 3, rateLimitedPct: 2.5, authErrors: 1, forbidden: 2, serverErrors: 0, p95Ms: 413 },
    ],
    calls5m: 10,
    rateLimited5m: 1,
    sonyP95Ms: 413,
    readP95Ms: 88,
    reads15m: 40,
    readsServedPct: 92.5,
    queue: { due: 4, queued: 9, running: 1, lagP95Ms: 61000, lagSamples: 30 },
  })
})

test('nothing recorded yet: zeros and nulls, never NaN', async () => {
  query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ account_id: null, kind: 'read', p95: null, n: 0, ok: -1 }] })
  const m = await psnMetrics()
  expect(m.readsServedPct).toBeNull()
  expect(m.readP95Ms).toBeNull()
  expect(m.queue).toEqual({ due: 0, queued: 0, running: 0, lagP95Ms: null, lagSamples: 0 })
  expect(m.calls5m).toBe(0)
})
