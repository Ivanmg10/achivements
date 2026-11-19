jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/psnAccounts', () => ({ insertPsnAccount: jest.fn() }))
jest.mock('@/lib/psnAccountCheck', () => ({ tryPsnNpsso: jest.fn() }))
jest.mock('@/lib/psnPoolStatus', () => ({ psnPoolStatus: jest.fn() }))

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from './route'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { insertPsnAccount } from '@/lib/psnAccounts'
import { tryPsnNpsso } from '@/lib/psnAccountCheck'
import { psnPoolStatus } from '@/lib/psnPoolStatus'
import { psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

const ADMIN = { id: '1', username: 'ivan', pwv: 'x' }
const NPSSO = 'b'.repeat(64)
const SIGN_IN = { npsso: NPSSO, expiresAt: Date.UTC(2027, 0, 10), tokens: {}, onlineId: 'ServiceTwo', avatarUrl: null }
const req = (body?: unknown) =>
  new NextRequest('http://localhost/api/admin/psn/accounts', { method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined }) as unknown as Request
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(tryPsnNpsso as jest.Mock).mockResolvedValue(SIGN_IN)
  ;(insertPsnAccount as jest.Mock).mockResolvedValue(7)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await GET(req())).status).toBe(403)
  expect((await POST(req({ label: 'PSN-2', npsso: NPSSO }))).status).toBe(403)
})

test('GET: the accounts, the pool and the PSN switches; a database failure is a 500', async () => {
  const status = psnStatus([psnAccount()])
  ;(psnPoolStatus as jest.Mock).mockResolvedValue(status)
  expect(data(await GET(req()))).toEqual({ ...status, switches: { mode: 'live', poolEnabled: true } })
  ;(psnPoolStatus as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await GET(req())).status).toBe(500)
})

test('POST: tested first, saved, logged without the NPSSO, answered without it', async () => {
  const res = await POST(req({ label: 'PSN-2', hint: 'blue', weight: 2, npsso: NPSSO }))
  expect(res.status).toBe(201)
  expect(data(res)).toEqual({ id: 7, onlineId: 'ServiceTwo', expiresAt: '2027-01-10T00:00:00.000Z' })
  expect(insertPsnAccount).toHaveBeenCalledWith({ label: 'PSN-2', hint: 'blue', weight: 2, by: 'ivan' }, SIGN_IN)
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'psn-account-add', null, { label: 'PSN-2', expiresAt: '2027-01-10T00:00:00.000Z' })
  expect(JSON.stringify((logAdminAction as jest.Mock).mock.calls)).not.toContain(NPSSO)
})

test('POST: a bad form or NPSSO is a 400; what Sony refuses is never saved', async () => {
  expect(data(await POST(req({ label: '', npsso: NPSSO })))).toEqual({ error: 'invalid' })
  expect(data(await POST(req({ label: 'PSN-2', npsso: 'x' })))).toEqual({ error: 'invalid-npsso' })
  ;(tryPsnNpsso as jest.Mock).mockResolvedValueOnce('rejected')
  expect((await POST(req({ label: 'PSN-2', npsso: NPSSO }))).status).toBe(422)
  ;(tryPsnNpsso as jest.Mock).mockResolvedValueOnce('failed')
  expect((await POST(req({ label: 'PSN-2', npsso: NPSSO }))).status).toBe(502)
  expect(insertPsnAccount).not.toHaveBeenCalled()
})

test('POST: a label in use is a 409; another save failure a 500', async () => {
  ;(insertPsnAccount as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' }))
  expect(data(await POST(req({ label: 'PSN-1', npsso: NPSSO })))).toEqual({ error: 'label-taken' })
  ;(insertPsnAccount as jest.Mock).mockRejectedValueOnce(new Error('down'))
  expect(data(await POST(req({ label: 'PSN-2', npsso: NPSSO })))).toEqual({ error: 'save-failed' })
})
