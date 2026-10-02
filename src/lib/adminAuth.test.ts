jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/userRecord', () => ({
  loadUser: jest.fn(),
  passwordVersion: (hash: string) => `pwv-${hash}`,
}))

import {
  ELEVATION_COOKIE,
  ELEVATION_MS,
  REAUTH_REQUIRED,
  elevationCookie,
  logAdminAction,
  readCookie,
  requireAdmin,
  requireAdminRole,
  signElevation,
  verifyElevation,
} from './adminAuth'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { loadUser } from '@/lib/userRecord'

process.env.NEXTAUTH_SECRET = 'test-secret'
const NOW = 1_800_000_000_000

const withCookie = (cookie?: string) =>
  ({ headers: new Headers(cookie ? { cookie } : {}) }) as unknown as Request

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '3' } })
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 3, username: 'boss', admin: true, password: 'hash1' })
})

describe('the unlock token', () => {
  const token = signElevation('3', 'pwv-hash1', NOW + 1000)

  test('is good for that admin, with that password, until it expires', () => {
    expect(verifyElevation(token, '3', 'pwv-hash1', NOW)).toBe(true)
    expect(verifyElevation(token, '3', 'pwv-hash1', NOW + 1000)).toBe(false)
  })

  test('is no good for another admin, or once the password changed', () => {
    expect(verifyElevation(token, '4', 'pwv-hash1', NOW)).toBe(false)
    expect(verifyElevation(token, '3', 'pwv-hash2', NOW)).toBe(false)
  })

  test('cannot be forged or stretched', () => {
    const [id, pwv, , sig] = token.split('.')
    expect(verifyElevation(`${id}.${pwv}.${NOW + 999_999}.${sig}`, '3', 'pwv-hash1', NOW)).toBe(false)
    expect(verifyElevation('garbage', '3', 'pwv-hash1', NOW)).toBe(false)
    expect(verifyElevation(null, '3', 'pwv-hash1', NOW)).toBe(false)
  })
})

test('the cookie is httpOnly, strict, only sent to the admin API, and lasts the unlock', () => {
  const cookie = elevationCookie('abc')
  expect(cookie).toContain(`${ELEVATION_COOKIE}=abc`)
  expect(cookie).toContain('Path=/api/admin')
  expect(cookie).toContain('HttpOnly')
  expect(cookie).toContain('SameSite=Strict')
  expect(cookie).toContain(`Max-Age=${ELEVATION_MS / 1000}`)
  expect(elevationCookie(null)).toContain('Max-Age=0')
})

test('readCookie finds one cookie among several', () => {
  expect(readCookie(withCookie('a=1; admin-elevation=x%2Ey; b=2'), ELEVATION_COOKIE)).toBe('x.y')
  expect(readCookie(withCookie(), ELEVATION_COOKIE)).toBeNull()
})

describe('requireAdminRole', () => {
  test('reads the admin flag fresh from the database', async () => {
    const result = await requireAdminRole()
    expect(loadUser).toHaveBeenCalledWith('3', { fresh: true })
    expect(result).toEqual({ ok: true, admin: { id: '3', username: 'boss', pwv: 'pwv-hash1' } })
  })

  test('401 without a session, 403 for someone just demoted or gone', async () => {
    ;(loadUser as jest.Mock).mockResolvedValueOnce({ id: 3, admin: false, password: 'h' })
    expect(((await requireAdminRole()) as { response: { status: number } }).response.status).toBe(403)
    ;(loadUser as jest.Mock).mockResolvedValueOnce(null)
    expect(((await requireAdminRole()) as { response: { status: number } }).response.status).toBe(403)
    ;(getServerSession as jest.Mock).mockResolvedValueOnce(null)
    expect(((await requireAdminRole()) as { response: { status: number } }).response.status).toBe(401)
  })
})

describe('requireAdmin', () => {
  test('an admin with a live unlock gets through', async () => {
    const token = signElevation('3', 'pwv-hash1', Date.now() + 60_000)
    const result = await requireAdmin(withCookie(`${ELEVATION_COOKIE}=${token}`))
    expect(result.ok).toBe(true)
  })

  test('an admin without one is asked to unlock again', async () => {
    const result = (await requireAdmin(withCookie())) as unknown as { ok: false; response: { status: number; data: unknown } }
    expect(result.response.status).toBe(403)
    expect(result.response.data).toEqual({ error: REAUTH_REQUIRED })
  })

  test('a password change since the unlock ends it', async () => {
    const token = signElevation('3', 'pwv-hash1', Date.now() + 60_000)
    ;(loadUser as jest.Mock).mockResolvedValue({ id: 3, username: 'boss', admin: true, password: 'hash2' })
    expect((await requireAdmin(withCookie(`${ELEVATION_COOKIE}=${token}`))).ok).toBe(false)
  })
})

describe('logAdminAction', () => {
  beforeEach(() => jest.spyOn(Math, 'random').mockReturnValue(0.9))

  test('records who did what to whom', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    await logAdminAction({ id: '3', username: 'boss' }, 'update-user', { id: 11, username: 'bob' }, { field: 'email' })
    expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['3', 'boss', 11, 'bob', 'update-user', '{"field":"email"}'])
  })

  test('never throws: the action already happened', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    await expect(logAdminAction({ id: '3', username: 'boss' }, 'unlock', null)).resolves.toBeUndefined()
  })
})
