jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/psnAccounts', () => ({ loadPoolAccount: jest.fn() }))
jest.mock('@/lib/psnAccountCheck', () => ({ checkPsnAccount: jest.fn() }))

import { NextRequest, NextResponse } from 'next/server'
import { POST } from './route'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { loadPoolAccount } from '@/lib/psnAccounts'
import { checkPsnAccount } from '@/lib/psnAccountCheck'

const ADMIN = { id: '1', username: 'ivan', pwv: 'x' }
const ACCOUNT = { id: 2, label: 'PSN-2', ratePerMin: 40 }
const req = () => new NextRequest('http://localhost/api/admin/psn/accounts/2/test', { method: 'POST' }) as unknown as Request
const params = (id = '2') => ({ params: Promise.resolve({ id }) })
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(loadPoolAccount as jest.Mock).mockResolvedValue(ACCOUNT)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await POST(req(), params())).status).toBe(403)
})

test('a working account: who it signs in as and how long Sony took, logged', async () => {
  ;(checkPsnAccount as jest.Mock).mockResolvedValue({ ok: true, profile: { onlineId: 'ServiceTwo' }, ms: 210 })
  expect(data(await POST(req(), params()))).toEqual({ onlineId: 'ServiceTwo', ms: 210 })
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'psn-account-test', null, { accountId: 2, label: 'PSN-2', ok: true })
})

test('a failing account is a 502 with why; a bad or unknown id 400 / 404; the database 500', async () => {
  ;(checkPsnAccount as jest.Mock).mockResolvedValue({ ok: false, error: 'auth' })
  const res = await POST(req(), params())
  expect([res.status, data(res)]).toEqual([502, { error: 'auth' }])
  expect((await POST(req(), params('x'))).status).toBe(400)
  ;(loadPoolAccount as jest.Mock).mockResolvedValueOnce(null)
  expect((await POST(req(), params())).status).toBe(404)
  ;(loadPoolAccount as jest.Mock).mockRejectedValueOnce(new Error('down'))
  expect((await POST(req(), params())).status).toBe(500)
})
