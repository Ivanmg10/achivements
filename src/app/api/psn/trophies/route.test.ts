jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnClient', () => ({
  ...jest.requireActual('@/lib/psnClient'),
  findPsnGame: jest.fn(),
  psnGameTrophies: jest.fn(),
  psnGameGroups: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import { findPsnGame, psnGameGroups, psnGameTrophies, PsnError } from '@/lib/psnClient'

const GAME = { titleId: 'NPWR00001_00', service: 'trophy2', lastPlayed: '2026-01-01T00:00:00Z' }

async function call(qs: string) {
  const res = await GET(new NextRequest(`http://localhost/api/psn/trophies?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.PSN_NPSSO = 'npsso'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(findPsnGame as jest.Mock).mockResolvedValue(GAME)
  ;(psnGameTrophies as jest.Mock).mockResolvedValue([{ id: 0 }])
  ;(psnGameGroups as jest.Mock).mockResolvedValue([{ id: 'default' }])
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call('id=NPWR00001_00')).status).toBe(401)
})

test.each(['', 'id=NPWR1_00', 'id=../x', 'id=CUSA01433_00'])('400 for a malformed id: %s', async (qs) => {
  expect(await call(qs)).toEqual({ status: 400, body: { error: 'invalid-title' } })
  expect(findPsnGame).not.toHaveBeenCalled()
})

test('404 for a game the account has never played', async () => {
  ;(findPsnGame as jest.Mock).mockResolvedValue(null)
  expect(await call('id=NPWR00001_00')).toEqual({ status: 404, body: { error: 'not-in-library' } })
  expect(psnGameTrophies).not.toHaveBeenCalled()
})

test("the game's trophies and groups, looked up through the user's list, in their language", async () => {
  expect(await call('id=NPWR00001_00&lang=es')).toEqual({ status: 200, body: { groups: [{ id: 'default' }], trophies: [{ id: 0 }] } })
  expect(findPsnGame).toHaveBeenCalledWith('42', 'NPWR00001_00', '7')
  expect(psnGameTrophies).toHaveBeenCalledWith('42', GAME, '7', 'es-ES')
  expect(psnGameGroups).toHaveBeenCalledWith('42', GAME, '7', 'es-ES')
})

test('403 for a hidden profile, 502 for anything else', async () => {
  ;(psnGameTrophies as jest.Mock).mockRejectedValueOnce(new PsnError('Not permitted by access control', 2240526))
  expect((await call('id=NPWR00001_00')).status).toBe(403)
  ;(findPsnGame as jest.Mock).mockRejectedValueOnce(new Error('network'))
  expect((await call('id=NPWR00001_00')).status).toBe(502)
})
