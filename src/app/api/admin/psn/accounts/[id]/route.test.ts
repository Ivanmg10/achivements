jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/psnAccounts', () => ({ updatePsnAccount: jest.fn(), deletePsnAccount: jest.fn() }))
jest.mock('@/lib/psnTokens', () => ({ forgetPsnTokens: jest.fn() }))

import { NextRequest, NextResponse } from 'next/server'
import { DELETE, PATCH } from './route'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { deletePsnAccount, updatePsnAccount } from '@/lib/psnAccounts'
import { forgetPsnTokens } from '@/lib/psnTokens'

const ADMIN = { id: '1', username: 'ivan', pwv: 'x' }
const req = (method: string, body?: unknown) =>
  new NextRequest('http://localhost/api/admin/psn/accounts/2', { method, body: body ? JSON.stringify(body) : undefined }) as unknown as Request
const params = (id = '2') => ({ params: Promise.resolve({ id }) })
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(updatePsnAccount as jest.Mock).mockResolvedValue(true)
  ;(deletePsnAccount as jest.Mock).mockResolvedValue(true)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await PATCH(req('PATCH', { status: 'paused' }), params())).status).toBe(403)
  expect((await DELETE(req('DELETE'), params())).status).toBe(403)
})

test('PATCH drains, pauses or tunes, and is logged', async () => {
  expect(data(await PATCH(req('PATCH', { status: 'draining' }), params()))).toEqual({ ok: true })
  expect(updatePsnAccount).toHaveBeenCalledWith(2, { status: 'draining' })
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'psn-account-update', null, { accountId: 2, status: 'draining' })
})

test('PATCH: a bad id or change is a 400, an unknown account a 404, the database a 500', async () => {
  expect((await PATCH(req('PATCH', { status: 'paused' }), params('x'))).status).toBe(400)
  expect((await PATCH(req('PATCH', { status: 'quarantined' }), params())).status).toBe(400)
  ;(updatePsnAccount as jest.Mock).mockResolvedValueOnce(false)
  expect((await PATCH(req('PATCH', { weight: 2 }), params())).status).toBe(404)
  ;(updatePsnAccount as jest.Mock).mockRejectedValueOnce(new Error('down'))
  expect((await PATCH(req('PATCH', { weight: 2 }), params())).status).toBe(500)
  expect(logAdminAction).not.toHaveBeenCalled()
})

test('DELETE removes it with its sign-in, drops the tokens held here, and is logged', async () => {
  expect(data(await DELETE(req('DELETE'), params()))).toEqual({ ok: true })
  expect(deletePsnAccount).toHaveBeenCalledWith(2)
  expect(forgetPsnTokens).toHaveBeenCalled()
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'psn-account-remove', null, { accountId: 2 })
})

test('DELETE: a bad id 400, an unknown account 404, the database 500', async () => {
  expect((await DELETE(req('DELETE'), params('0'))).status).toBe(400)
  ;(deletePsnAccount as jest.Mock).mockResolvedValueOnce(false)
  expect((await DELETE(req('DELETE'), params())).status).toBe(404)
  ;(deletePsnAccount as jest.Mock).mockRejectedValueOnce(new Error('down'))
  expect((await DELETE(req('DELETE'), params())).status).toBe(500)
})
