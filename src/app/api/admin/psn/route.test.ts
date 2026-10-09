jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/psnCredentials', () => ({
  ...jest.requireActual('@/lib/psnCredentials'),
  loadPsnCredentials: jest.fn(),
  npssoExpiry: jest.fn(),
  savePsnNpsso: jest.fn(),
  savePsnTokens: jest.fn(),
}))
jest.mock('@/lib/psnClient', () => ({ verifyNpsso: jest.fn(), forgetPsnTokens: jest.fn() }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { NextRequest, NextResponse } from 'next/server'
import { GET, PUT } from './route'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { loadPsnCredentials, npssoExpiry, savePsnNpsso, savePsnTokens } from '@/lib/psnCredentials'
import { forgetPsnTokens, verifyNpsso } from '@/lib/psnClient'

const ADMIN = { id: '1', username: 'ivan', pwv: 'x' }
const NPSSO = 'b'.repeat(64)
const req = (body?: unknown) =>
  new NextRequest('http://localhost/api/admin/psn', { method: body ? 'PUT' : 'GET', body: body ? JSON.stringify(body) : undefined }) as unknown as Request
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  delete process.env.PSN_NPSSO
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in', async () => {
  const denied = NextResponse.json({ error: 'reauth-required' }, { status: 403 })
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect((await GET(req())).status).toBe(403)
  expect((await PUT(req({ npsso: NPSSO }))).status).toBe(403)
})

test('GET: when the stored NPSSO dies, and who set it', async () => {
  const expires = Date.now() + 10.5 * 86_400_000
  ;(loadPsnCredentials as jest.Mock).mockResolvedValue({ npsso: NPSSO, npssoExpiresAt: expires, updatedAt: 0, updatedBy: 'ivan' })
  expect(data(await GET(req()))).toMatchObject({ configured: true, stored: true, daysLeft: 10, updatedBy: 'ivan' })
})

test('GET: nothing stored, nothing in the environment, is not configured', async () => {
  ;(loadPsnCredentials as jest.Mock).mockResolvedValue(null)
  expect(data(await GET(req()))).toMatchObject({ configured: false, stored: false, daysLeft: null })
})

test('PUT: rejects what is not an NPSSO, without asking Sony', async () => {
  const res = await PUT(req({ npsso: 'short' }))
  expect(res.status).toBe(400)
  expect(npssoExpiry).not.toHaveBeenCalled()
})

test('PUT: one Sony does not accept is not stored', async () => {
  ;(npssoExpiry as jest.Mock).mockResolvedValue(null)
  expect((await PUT(req({ npsso: NPSSO }))).status).toBe(422)
  expect(savePsnNpsso).not.toHaveBeenCalled()
})

test('PUT: a good one is checked, stored with its tokens, and logged', async () => {
  const expires = Date.now() + 60 * 86_400_000
  ;(npssoExpiry as jest.Mock).mockResolvedValue(expires)
  ;(verifyNpsso as jest.Mock).mockResolvedValue({ accessToken: 'a' })
  const res = await PUT(req({ npsso: ` ${NPSSO} ` }))
  expect(res.status).toBe(200)
  expect(savePsnNpsso).toHaveBeenCalledWith(NPSSO, expires, 'ivan')
  expect(savePsnTokens).toHaveBeenCalledWith({ accessToken: 'a' })
  expect(forgetPsnTokens).toHaveBeenCalled()
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'psn-token', null, { expiresAt: new Date(expires).toISOString() })
})

test('PUT: a failed exchange is a 502 and nothing is stored', async () => {
  ;(npssoExpiry as jest.Mock).mockResolvedValue(Date.now() + 1000)
  ;(verifyNpsso as jest.Mock).mockRejectedValue(new Error('sony down'))
  expect((await PUT(req({ npsso: NPSSO }))).status).toBe(502)
  expect(savePsnNpsso).not.toHaveBeenCalled()
})

test('PUT: Sony accepts it but the save fails — a 500 that says so, not a Sony error', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(npssoExpiry as jest.Mock).mockResolvedValue(Date.now() + 1000)
  ;(verifyNpsso as jest.Mock).mockResolvedValue({ accessToken: 'a' })
  ;(savePsnNpsso as jest.Mock).mockRejectedValueOnce(new Error('relation "psn_credentials" does not exist'))
  const res = await PUT(req({ npsso: NPSSO }))
  expect(res.status).toBe(500)
  expect(data(res)).toEqual({ error: 'save-failed' })
  expect(logAdminAction).not.toHaveBeenCalled()
})
