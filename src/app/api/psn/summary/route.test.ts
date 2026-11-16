jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnSnapshot', () => ({ psnSummary: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { PsnError, PsnSyncing } from '@/lib/psnClient'
import { psnSummary } from '@/lib/psnSnapshot'

async function call() {
  const res = await GET()
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

const SUMMARY = { onlineId: 'Hakoom', games: 3, syncedAt: 1_000, nextSyncAt: 1_000 + 10 * 60_000 }

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(psnSummary as jest.Mock).mockResolvedValue(SUMMARY)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call()).status).toBe(401)
})

test('400 without a linked PSN account', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  expect(await call()).toEqual({ status: 400, body: { error: 'not-linked' } })
})

test('the stored summary of the linked account, with when Sony was last checked', async () => {
  expect(await call()).toEqual({ status: 200, body: SUMMARY })
  expect(psnSummary).toHaveBeenCalledWith('42', '7')
})

test('202 before the first sync is stored', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new PsnSyncing())
  expect(await call()).toEqual({ status: 202, body: { status: 'syncing' } })
})

test('403 when the profile went private since it was linked', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new PsnError('Not permitted by access control', 2240526))
  expect(await call()).toEqual({ status: 403, body: { error: 'private' } })
})

test('502 when reading it fails otherwise', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new Error('database'))
  expect(await call()).toEqual({ status: 502, body: { error: 'failed' } })
})

test('the browser may keep it for five minutes, privately, and a new session cookie asks again', async () => {
  const res = await GET()
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=300')
  expect(res.headers.get('Vary')).toBe('Cookie')
})
