jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnClient', () => ({
  ...jest.requireActual('@/lib/psnClient'),
  psnSummary: jest.fn(),
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { psnSummary, PsnError } from '@/lib/psnClient'

async function call() {
  const res = await GET()
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  process.env.PSN_NPSSO = 'npsso'
  ;(psnSummary as jest.Mock).mockResolvedValue({ onlineId: 'Hakoom', games: 3 })
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

test('503 when the app has no PSN sign-in', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new PsnError('no sign-in', -1))
  expect(await call()).toEqual({ status: 503, body: { error: 'not-configured' } })
})

test('the summary of the linked account, cached under the user', async () => {
  expect(await call()).toEqual({ status: 200, body: { onlineId: 'Hakoom', games: 3 } })
  expect(psnSummary).toHaveBeenCalledWith('42', '7')
})

test('403 when the profile went private since it was linked', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new PsnError('Not permitted by access control', 2240526))
  expect(await call()).toEqual({ status: 403, body: { error: 'private' } })
})

test('502 when PSN fails otherwise', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new Error('network'))
  expect(await call()).toEqual({ status: 502, body: { error: 'failed' } })
})
