jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/scoreRefresh', () => ({ onPlatformLinked: jest.fn() }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/psnCache', () => ({ ...jest.requireActual('@/lib/psnCache'), forgetPsnPrivate: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({
  ...jest.requireActual('@/lib/psnClient'),
  psnConfigured: jest.fn(() => true),
  findPsnAccount: jest.fn(),
  psnSummary: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { forgetUser } from '@/lib/userRecord'
import { forgetPsnPrivate } from '@/lib/psnCache'
import { findPsnAccount, psnConfigured, psnSummary, PsnError } from '@/lib/psnClient'

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/psn/link', { method: 'POST', body: JSON.stringify(body) }) as unknown as Request

async function call(body: unknown) {
  const res = await POST(post(body))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(psnConfigured as jest.Mock).mockReturnValue(true)
  ;(findPsnAccount as jest.Mock).mockResolvedValue({ accountId: '42', onlineId: 'Hakoom' })
  ;(psnSummary as jest.Mock).mockResolvedValue({})
  ;(pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call({ username: 'Hakoom' })).status).toBe(401)
})

test('503 when the server has no NPSSO token', async () => {
  ;(psnConfigured as jest.Mock).mockReturnValue(false)
  expect(await call({ username: 'Hakoom' })).toEqual({ status: 503, body: { error: 'not-configured' } })
})

test.each([[{}], [{ username: 'ab' }], [{ username: 'has space' }], [{ username: 'x'.repeat(17) }], [{ username: 3 }]])(
  '400 for an online ID PSN would not allow: %j',
  async (body) => {
    expect(await call(body)).toEqual({ status: 400, body: { error: 'invalid-username' } })
    expect(findPsnAccount).not.toHaveBeenCalled()
  },
)

test('404 when no account has that online ID', async () => {
  ;(findPsnAccount as jest.Mock).mockResolvedValue(null)
  expect(await call({ username: 'Hakoom' })).toEqual({ status: 404, body: { error: 'not-found' } })
  expect(pool.query).not.toHaveBeenCalled()
})

test('403 when the profile hides its trophies, and nothing is saved', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new PsnError('Not permitted by access control', 2240526))
  expect(await call({ username: 'Hakoom' })).toEqual({ status: 403, body: { error: 'private' } })
  expect(pool.query).not.toHaveBeenCalled()
  // Asked fresh: a profile made public a minute ago is not refused from memory.
  expect(forgetPsnPrivate).toHaveBeenCalledWith(expect.any(String))
})

test('502 when PSN fails otherwise', async () => {
  ;(findPsnAccount as jest.Mock).mockRejectedValue(new Error('network'))
  expect(await call({ username: 'Hakoom' })).toEqual({ status: 502, body: { error: 'failed' } })
})

test('500 when the save fails', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect(await call({ username: 'Hakoom' })).toEqual({ status: 500, body: { error: 'failed' } })
  expect(forgetUser).not.toHaveBeenCalled()
})

test('saves the account as PSN spells it and drops the cached user row', async () => {
  expect(await call({ username: ' hakoom ' })).toEqual({
    status: 200,
    body: { psnaccountid: '42', psnusername: 'Hakoom' },
  })
  expect(findPsnAccount).toHaveBeenCalledWith('hakoom')
  expect(pool.query).toHaveBeenCalledWith('UPDATE users SET psnaccountid = $1, psnusername = $2, psn_verified_at = NULL, psn_verification_code = NULL, psn_verification_expires_at = NULL WHERE id = $3', [
    '42',
    'Hakoom',
    '7',
  ])
  expect(forgetUser).toHaveBeenCalledWith('7')
})
