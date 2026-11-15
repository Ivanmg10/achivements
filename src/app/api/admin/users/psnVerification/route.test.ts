jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { NextRequest, NextResponse } from 'next/server'
import { DELETE } from './route'
import pool from '@/lib/db'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { forgetUser } from '@/lib/userRecord'

const ADMIN = { id: '1', username: 'ivan' }
const del = (id: string) => new NextRequest(`http://localhost/api/admin/users/psnVerification?id=${id}`, { method: 'DELETE' }) as unknown as Request
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await DELETE(del('5'))).status).toBe(403)
  expect(pool.query).not.toHaveBeenCalled()
})

test.each(['', 'abc', '5; DROP'])('400 for an id that is not a number: %j', async (id) => {
  expect((await DELETE(del(id))).status).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('404 for a user that does not exist', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  expect((await DELETE(del('5'))).status).toBe(404)
  expect(logAdminAction).not.toHaveBeenCalled()
})

test('clears the verification and its code, forgets the user and logs it', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 5, username: 'bob', psnaccountid: '42' }] })
  const res = await DELETE(del('5'))
  expect(res.status).toBe(200)
  expect(data(res)).toEqual({ ok: true })
  const [sql, values] = (pool.query as jest.Mock).mock.calls[0]
  expect(sql).toMatch(/psn_verified_at = NULL, psn_verification_code = NULL, psn_verification_expires_at = NULL/)
  expect(values).toEqual(['5'])
  expect(forgetUser).toHaveBeenCalledWith(5)
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'clear-psn-verification', expect.objectContaining({ username: 'bob' }), { psnaccountid: '42' })
})

test('500 when the write fails', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await DELETE(del('5'))).status).toBe(500)
})
