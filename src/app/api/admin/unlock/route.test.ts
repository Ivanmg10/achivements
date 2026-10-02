jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/adminAuth', () => ({
  ...jest.requireActual('@/lib/adminAuth'),
  requireAdminRole: jest.fn(),
  logAdminAction: jest.fn(),
}))
jest.mock('@/lib/currentPassword', () => ({ checkCurrentPassword: jest.fn() }))

import { DELETE, POST } from './route'
import { NextResponse } from 'next/server'
import { ELEVATION_COOKIE, logAdminAction, requireAdminRole, verifyElevation } from '@/lib/adminAuth'
import { checkCurrentPassword } from '@/lib/currentPassword'

const ADMIN = { id: '3', username: 'boss', pwv: 'v1' }
const request = (body: unknown) => ({ json: () => Promise.resolve(body) }) as unknown as Request
const setCookie = (res: unknown) => (res as { headers: Map<string, string> }).headers.get('Set-Cookie') ?? ''

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  ;(requireAdminRole as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('ok')
})

test('the right password unlocks the panel with a signed cookie, and it is logged', async () => {
  const res = await POST(request({ password: 'secret12' }))
  expect(res.status).toBe(200)
  expect(checkCurrentPassword).toHaveBeenCalledWith('3', 'secret12')

  const value = decodeURIComponent(setCookie(res).match(new RegExp(`${ELEVATION_COOKIE}=([^;]+)`))![1])
  expect(verifyElevation(value, '3', 'v1')).toBe(true)
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'unlock', null)
})

test.each([
  ['wrong', 403],
  ['too-many', 429],
  ['no-user', 401],
])('a %s password check answers %s and unlocks nothing', async (check, status) => {
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue(check)
  const res = await POST(request({ password: 'guess' }))
  expect(res.status).toBe(status)
  expect(setCookie(res)).toBe('')
})

test('only admins can try', async () => {
  const forbidden = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  ;(requireAdminRole as jest.Mock).mockResolvedValue({ ok: false, response: forbidden })
  expect(await POST(request({ password: 'x' }))).toBe(forbidden)
  expect(checkCurrentPassword).not.toHaveBeenCalled()
})

test('locking clears the cookie', async () => {
  expect(setCookie(await DELETE())).toContain('Max-Age=0')
})
