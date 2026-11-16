jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnQueue', () => ({ PRIORITY: { manual: 1 }, psnJobsOf: jest.fn() }))
jest.mock('@/lib/psnStore', () => ({ loadPsnPlayer: jest.fn() }))
jest.mock('@/lib/psnSync', () => ({ requestPsnSync: jest.fn() }))
jest.mock('@/lib/psnSnapshot', () => ({ REFRESH_MS: 600_000, lastChecked: (p: { summaryAt: number | null }) => p.summaryAt }))

import { getServerSession } from 'next-auth'
import { POST } from './route'
import { psnJobsOf } from '@/lib/psnQueue'
import { loadPsnPlayer } from '@/lib/psnStore'
import { requestPsnSync } from '@/lib/psnSync'

const NOW = 1_800_000_000_000
const call = async () => {
  const res = await POST()
  return { status: res.status, body: (res as unknown as { data: unknown }).data, retry: res.headers.get('Retry-After') }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Date, 'now').mockReturnValue(NOW)
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(psnJobsOf as jest.Mock).mockResolvedValue([])
  ;(loadPsnPlayer as jest.Mock).mockResolvedValue({ summaryAt: NOW - 11 * 60_000 })
})
afterEach(() => jest.restoreAllMocks())

test('202: a manual sync queued, first after links', async () => {
  expect(await call()).toMatchObject({ status: 202, body: { status: 'queued' } })
  expect(requestPsnSync).toHaveBeenCalledWith('7', 1)
})

test('409 while the summary or the list is being read', async () => {
  ;(psnJobsOf as jest.Mock).mockResolvedValue([{ phase: 'titles', status: 'running', priority: 0 }])
  expect(await call()).toMatchObject({ status: 409, body: { error: 'syncing' } })
  expect(requestPsnSync).not.toHaveBeenCalled()
})

test('429 within ten minutes of the last check, saying how long to wait', async () => {
  ;(loadPsnPlayer as jest.Mock).mockResolvedValue({ summaryAt: NOW - 4 * 60_000 })
  expect(await call()).toEqual({ status: 429, body: { error: 'too-soon' }, retry: '360' })
})

test('a history still running does not hold a refresh up; never synced is queued too', async () => {
  ;(psnJobsOf as jest.Mock).mockResolvedValue([{ phase: 'history', status: 'running', priority: 4 }])
  ;(loadPsnPlayer as jest.Mock).mockResolvedValue(null)
  expect((await call()).status).toBe(202)
})

test('401 signed out, 500 when the database fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(psnJobsOf as jest.Mock).mockRejectedValueOnce(new Error('db'))
  expect((await call()).status).toBe(500)
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call()).status).toBe(401)
})
