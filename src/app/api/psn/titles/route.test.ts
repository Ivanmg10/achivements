jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnSnapshot', () => ({ psnLibrary: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { PsnError } from '@/lib/psnClient'
import { psnLibrary } from '@/lib/psnSnapshot'

async function call() {
  const res = await GET()
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.PSN_NPSSO = 'npsso'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(psnLibrary as jest.Mock).mockResolvedValue([{ id: 'NPWR00001_00' }])
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
  ;(psnLibrary as jest.Mock).mockRejectedValue(new PsnError('no sign-in', -1))
  expect(await call()).toEqual({ status: 503, body: { error: 'not-configured' } })
})

test('the linked account\'s games, cached under the user', async () => {
  expect(await call()).toEqual({ status: 200, body: [{ id: 'NPWR00001_00' }] })
  expect(psnLibrary).toHaveBeenCalledWith('42', '7')
})

test('403 for a hidden profile, 502 for anything else', async () => {
  ;(psnLibrary as jest.Mock).mockRejectedValueOnce(new PsnError('Not permitted by access control', 2240526))
  expect((await call()).status).toBe(403)
  ;(psnLibrary as jest.Mock).mockRejectedValueOnce(new Error('network'))
  expect((await call()).status).toBe(502)
})
