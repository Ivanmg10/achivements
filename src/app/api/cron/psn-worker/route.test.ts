/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnQueue', () => ({ drainPsnQueue: jest.fn(async () => 4), sweepPsnJobs: jest.fn() }))
jest.mock('@/lib/psnSync', () => ({ enqueueDuePsnSyncs: jest.fn(async () => 2), runPsnJob: jest.fn(), sweepPsnPlayers: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { drainPsnQueue, sweepPsnJobs } from '@/lib/psnQueue'
import { enqueueDuePsnSyncs, runPsnJob, sweepPsnPlayers } from '@/lib/psnSync'

const req = (auth?: string) => new NextRequest('http://localhost/api/cron/psn-worker', { headers: auth ? { authorization: auth } : {} })

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'cron'
})
afterEach(() => delete process.env.CRON_SECRET)

test('refuses anyone without the cron secret', async () => {
  expect((await GET(req())).status).toBe(401)
  expect((await GET(req('Bearer wrong'))).status).toBe(401)
  expect(drainPsnQueue).not.toHaveBeenCalled()
})

test('queues the due syncs, sweeps, then drains the queue within its time', async () => {
  const res = await GET(req('Bearer cron'))
  expect((res as unknown as { data: unknown }).data).toEqual({ queued: 2, ran: 4 })
  expect(enqueueDuePsnSyncs).toHaveBeenCalled()
  expect(sweepPsnJobs).toHaveBeenCalled()
  expect(sweepPsnPlayers).toHaveBeenCalled()
  expect(drainPsnQueue).toHaveBeenCalledWith(runPsnJob, expect.any(Number))
  const deadline = (drainPsnQueue as jest.Mock).mock.calls[0][1]
  expect(deadline - Date.now()).toBeLessThanOrEqual(55_000)
})

test('500 when the database fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(enqueueDuePsnSyncs as jest.Mock).mockRejectedValueOnce(new Error('db'))
  expect((await GET(req('Bearer cron'))).status).toBe(500)
  ;(console.error as jest.Mock).mockRestore()
})
