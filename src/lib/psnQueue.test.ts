/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { PsnBusyError, PsnError } from '@/lib/psnErrors'
import { claimPsnJob, drainPsnQueue, enqueuePsn, psnRetryFor, retryPsnJob, sweepPsnJobs } from './psnQueue'

const query = pool.query as jest.Mock
const sql = (i: number) => String(query.mock.calls[i][0])
const JOB = { id: '5', user_id: 7, phase: 'titles', priority: 0, attempts: 1 }

beforeEach(() => {
  jest.clearAllMocks()
  query.mockResolvedValue({ rows: [], rowCount: 1 })
})

test('enqueueing again makes a queued job more urgent and never adds a second one', async () => {
  await enqueuePsn('7', 'summary', 1, 30_000)
  expect(sql(0)).toContain("ON CONFLICT (user_id, phase) WHERE status IN ('queued', 'running') DO UPDATE")
  expect(sql(0)).toContain('LEAST(psn_sync_jobs.priority, EXCLUDED.priority)')
  expect(sql(0)).toContain("WHERE psn_sync_jobs.status = 'queued'")
  expect(query.mock.calls[0][1]).toEqual([7, 'summary', 1, 30])
})

test('a claim takes the most urgent due job, or one whose worker died, without waiting on another', async () => {
  query.mockResolvedValueOnce({ rows: [JOB] })
  expect(await claimPsnJob('w1')).toEqual({ id: 5, userId: 7, phase: 'titles', priority: 0, attempts: 1 })
  expect(sql(0)).toContain('ORDER BY priority, run_after')
  expect(sql(0)).toContain('FOR UPDATE SKIP LOCKED')
  expect(sql(0)).toContain("status = 'running' AND locked_until < now()")
  expect(await claimPsnJob('w1')).toBeNull()
})

test('a retry backs off; past five attempts it fails; the budget spent is not an attempt', async () => {
  await retryPsnJob({ id: 5, userId: 7, phase: 'titles', priority: 0, attempts: 2 }, 120_000, 'failed')
  expect(query.mock.calls[0][1]).toEqual([5, 'queued', 120, 'failed', 0])
  await retryPsnJob({ id: 5, userId: 7, phase: 'titles', priority: 0, attempts: 5 }, 60_000, 'failed')
  expect(query.mock.calls[1][1][1]).toBe('failed')
  await retryPsnJob({ id: 5, userId: 7, phase: 'titles', priority: 0, attempts: 5 }, 60_000, 'busy', false)
  expect(query.mock.calls[2][1]).toEqual([5, 'queued', 60, 'busy', 1])
  expect(psnRetryFor(new PsnBusyError())).toEqual({ delayMs: 60_000, error: 'busy', countsAsAttempt: false })
  expect(psnRetryFor(new PsnError('Too many requests')).error).toBe('rate-limited')
  expect(psnRetryFor(new Error('x')).error).toBe('failed')
})

test('a drain runs jobs until none is due, marks each done, then queues what it asked for', async () => {
  query.mockResolvedValueOnce({ rows: [JOB] }).mockResolvedValue({ rows: [], rowCount: 1 })
  const run = jest.fn(async () => [{ phase: 'recent' as const, priority: 0 }])
  expect(await drainPsnQueue(run, Date.now() + 60_000)).toBe(1)
  const statements = query.mock.calls.map((c) => String(c[0]))
  const done = statements.findIndex((s) => s.includes("status = 'done'"))
  const next = statements.findIndex((s) => s.includes('INSERT INTO psn_sync_jobs'))
  expect(done).toBeGreaterThan(0)
  expect(next).toBeGreaterThan(done)
})

test('a job that throws goes back to the queue with its error code; the drain goes on', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  query.mockResolvedValueOnce({ rows: [JOB] }).mockResolvedValue({ rows: [], rowCount: 1 })
  await drainPsnQueue(async () => {
    throw new Error('sony down')
  }, Date.now() + 60_000)
  const retry = query.mock.calls.find((c) => String(c[0]).includes('run_after = now() + make_interval'))!
  expect(retry[1]).toEqual([5, 'queued', 60, 'failed', 0])
  ;(console.error as jest.Mock).mockRestore()
})

test('no time left: nothing is claimed', async () => {
  expect(await drainPsnQueue(jest.fn(), Date.now() + 5_000)).toBe(0)
  expect(query).not.toHaveBeenCalled()
})

test('finished jobs older than a week are swept', async () => {
  await sweepPsnJobs()
  expect(sql(0)).toContain("status IN ('done', 'failed') AND updated_at < now() - interval '7 days'")
})
