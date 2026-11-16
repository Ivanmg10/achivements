jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnSnapshot', () => ({ psnGame: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { GET as byPath } from '../game/[npwr]/route'
import { getServerSession } from 'next-auth'
import { PsnError, PsnSyncing } from '@/lib/psnClient'
import { psnGame } from '@/lib/psnSnapshot'

const ANSWER = { groups: [{ id: 'default' }], trophies: [{ id: 0 }] }

async function call(qs: string) {
  const res = await GET(new NextRequest(`http://localhost/api/psn/trophies?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(psnGame as jest.Mock).mockResolvedValue(ANSWER)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call('id=NPWR00001_00')).status).toBe(401)
})

test.each(['', 'id=NPWR1_00', 'id=../x', 'id=CUSA01433_00'])('400 for a malformed id: %s', async (qs) => {
  expect(await call(qs)).toEqual({ status: 400, body: { error: 'invalid-title' } })
  expect(psnGame).not.toHaveBeenCalled()
})

test('404 for a game the account has never played', async () => {
  ;(psnGame as jest.Mock).mockResolvedValue(null)
  expect(await call('id=NPWR00001_00')).toEqual({ status: 404, body: { error: 'not-in-library' } })
})

test("the game's stored trophies and groups, in the reader's language", async () => {
  expect(await call('id=NPWR00001_00&lang=es')).toEqual({ status: 200, body: ANSWER })
  expect(psnGame).toHaveBeenCalledWith('42', 'NPWR00001_00', '7', 'es-ES')
})

test('202 while its trophies are first read, 403 for a hidden profile, 502 for anything else', async () => {
  ;(psnGame as jest.Mock).mockRejectedValueOnce(new PsnSyncing())
  expect((await call('id=NPWR00001_00')).status).toBe(202)
  ;(psnGame as jest.Mock).mockRejectedValueOnce(new PsnError('Not permitted by access control', 2240526))
  expect((await call('id=NPWR00001_00')).status).toBe(403)
  ;(psnGame as jest.Mock).mockRejectedValueOnce(new Error('database'))
  expect((await call('id=NPWR00001_00')).status).toBe(502)
})

test('the browser may keep the answer a minute, privately, and a new session cookie asks again', async () => {
  const res = await GET(new NextRequest('http://localhost/api/psn/trophies?id=NPWR00001_00'))
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=60')
  expect(res.headers.get('Vary')).toBe('Cookie')
})

test('/api/psn/game/[npwr] answers the same, the set in the path', async () => {
  const res = await byPath(new NextRequest('http://localhost/api/psn/game/NPWR00001_00?lang=fr'), { params: Promise.resolve({ npwr: 'NPWR00001_00' }) })
  expect((res as unknown as { data: unknown }).data).toEqual(ANSWER)
  expect(psnGame).toHaveBeenCalledWith('42', 'NPWR00001_00', '7', 'fr-FR')
  const bad = await byPath(new NextRequest('http://localhost/api/psn/game/x'), { params: Promise.resolve({ npwr: 'x' }) })
  expect(bad.status).toBe(400)
})
