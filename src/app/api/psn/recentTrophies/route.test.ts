jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnClient', () => ({
  ...jest.requireActual('@/lib/psnClient'),
  psnLatestTrophies: jest.fn(),
  psnRecentTrophies: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import { psnLatestTrophies, psnRecentTrophies, PsnError } from '@/lib/psnClient'

async function call(qs = '') {
  const res = await GET(new NextRequest(`http://localhost/api/psn/recentTrophies?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.PSN_NPSSO = 'npsso'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(psnLatestTrophies as jest.Mock).mockResolvedValue([{ trophyId: 1 }])
  ;(psnRecentTrophies as jest.Mock).mockResolvedValue([{ trophyId: 2 }])
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call()).status).toBe(401)
})

test('400 without a linked PSN account', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  expect((await call()).status).toBe(400)
})

test('400 for an unknown scope', async () => {
  expect(await call('scope=forever')).toEqual({ status: 400, body: { error: 'invalid-scope' } })
})

test('recent (the default): the latest trophies', async () => {
  expect(await call()).toEqual({ status: 200, body: [{ trophyId: 1 }] })
  expect(psnLatestTrophies).toHaveBeenCalledWith('42', '7', 'en-US')
})

test.each([
  ['activity', 60],
  ['year', 366],
])('%s: the last %i days', async (scope, days) => {
  expect(await call(`scope=${scope}`)).toEqual({ status: 200, body: [{ trophyId: 2 }] })
  expect(psnRecentTrophies).toHaveBeenCalledWith('42', days, '7', 'en-US')
})

test('403 for a hidden profile, 502 for anything else', async () => {
  ;(psnLatestTrophies as jest.Mock).mockRejectedValueOnce(new PsnError('Not permitted by access control', 2240526))
  expect((await call()).status).toBe(403)
  ;(psnLatestTrophies as jest.Mock).mockRejectedValueOnce(new Error('network'))
  expect((await call()).status).toBe(502)
})

test("trophy names come in the app's language", async () => {
  await call('scope=year&lang=fr')
  expect(psnRecentTrophies).toHaveBeenCalledWith('42', 366, '7', 'fr-FR')
})
