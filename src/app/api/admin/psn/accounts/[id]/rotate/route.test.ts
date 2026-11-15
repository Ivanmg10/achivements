jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/psnAccounts', () => ({ renewPsnAccount: jest.fn() }))
jest.mock('@/lib/psnAccountCheck', () => ({ tryPsnNpsso: jest.fn() }))
jest.mock('@/lib/psnTokens', () => ({ forgetPsnTokens: jest.fn() }))

import { NextRequest, NextResponse } from 'next/server'
import { POST } from './route'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { renewPsnAccount } from '@/lib/psnAccounts'
import { tryPsnNpsso } from '@/lib/psnAccountCheck'
import { forgetPsnTokens } from '@/lib/psnTokens'

const ADMIN = { id: '1', username: 'ivan', pwv: 'x' }
const NPSSO = 'c'.repeat(64)
const SIGN_IN = { npsso: NPSSO, expiresAt: Date.UTC(2027, 0, 10), tokens: {}, onlineId: 'ServiceTwo', avatarUrl: null }
const req = (body: unknown) => new NextRequest('http://localhost/api/admin/psn/accounts/2/rotate', { method: 'POST', body: JSON.stringify(body) }) as unknown as Request
const params = (id = '2') => ({ params: Promise.resolve({ id }) })
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(tryPsnNpsso as jest.Mock).mockResolvedValue(SIGN_IN)
  ;(renewPsnAccount as jest.Mock).mockResolvedValue(true)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await POST(req({ npsso: NPSSO }), params())).status).toBe(403)
})

test('a new NPSSO that works replaces the old, is logged without itself and answered without itself', async () => {
  const res = await POST(req({ npsso: NPSSO }), params())
  expect(data(res)).toEqual({ onlineId: 'ServiceTwo', expiresAt: '2027-01-10T00:00:00.000Z' })
  expect(renewPsnAccount).toHaveBeenCalledWith(2, 'ivan', SIGN_IN)
  expect(forgetPsnTokens).toHaveBeenCalled()
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'psn-account-renew', null, { accountId: 2, expiresAt: '2027-01-10T00:00:00.000Z' })
  expect(JSON.stringify(data(res))).not.toContain(NPSSO)
})

test('one that does not work leaves the old one serving', async () => {
  ;(tryPsnNpsso as jest.Mock).mockResolvedValueOnce('rejected')
  expect((await POST(req({ npsso: NPSSO }), params())).status).toBe(422)
  ;(tryPsnNpsso as jest.Mock).mockResolvedValueOnce('failed')
  expect((await POST(req({ npsso: NPSSO }), params())).status).toBe(502)
  expect(renewPsnAccount).not.toHaveBeenCalled()
})

test('a bad id or NPSSO 400, an unknown account 404, a save failure 500', async () => {
  expect((await POST(req({ npsso: NPSSO }), params('x'))).status).toBe(400)
  expect(data(await POST(req({ npsso: 'short' }), params()))).toEqual({ error: 'invalid-npsso' })
  ;(renewPsnAccount as jest.Mock).mockResolvedValueOnce(false)
  expect((await POST(req({ npsso: NPSSO }), params())).status).toBe(404)
  ;(renewPsnAccount as jest.Mock).mockRejectedValueOnce(new Error('down'))
  expect(data(await POST(req({ npsso: NPSSO }), params()))).toEqual({ error: 'save-failed' })
})
