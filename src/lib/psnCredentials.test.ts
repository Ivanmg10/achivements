/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { daysLeft, loadPsnCredentials, npssoExpiry, savePsnNpsso, savePsnTokens } from './psnCredentials'

const NPSSO = 'a'.repeat(64)

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('what is saved is sealed, and reads back as it was', async () => {
  await savePsnNpsso(NPSSO, Date.UTC(2026, 11, 1), 'ivan')
  const [, params] = (pool.query as jest.Mock).mock.calls[0]
  expect(params[0]).not.toBe(NPSSO)

  await savePsnTokens({ accessToken: 'acc', accessExpiresAt: 2_000, refreshToken: 'ref', refreshExpiresAt: 3_000 })
  const [, tokenParams] = (pool.query as jest.Mock).mock.calls[1]
  expect(tokenParams).not.toContain('acc')

  ;(pool.query as jest.Mock).mockResolvedValueOnce({
    rows: [{
      npsso: params[0], npsso_expires_at: new Date(Date.UTC(2026, 11, 1)),
      access_token: tokenParams[0], access_expires_at: new Date(2_000),
      refresh_token: tokenParams[2], refresh_expires_at: new Date(3_000),
      updated_at: new Date(1_000), updated_by: 'ivan', warned_at: null,
    }],
  })
  expect(await loadPsnCredentials()).toEqual({
    npsso: NPSSO,
    npssoExpiresAt: Date.UTC(2026, 11, 1),
    tokens: { accessToken: 'acc', accessExpiresAt: 2_000, refreshToken: 'ref', refreshExpiresAt: 3_000 },
    updatedAt: 1_000,
    updatedBy: 'ivan',
    warnedAt: null,
  })
})

test('no row is no credentials', async () => {
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
  expect(await loadPsnCredentials()).toBeNull()
})

test('Sony says how long an NPSSO has left; anything else is null', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ npsso: NPSSO, expires_in: 86_400 }) })
  const at = await npssoExpiry(NPSSO)
  expect(at! - Date.now()).toBeGreaterThan(86_000_000)

  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
  expect(await npssoExpiry(NPSSO)).toBeNull()
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({}) })
  expect(await npssoExpiry(NPSSO)).toBeNull()
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  expect(await npssoExpiry(NPSSO)).toBeNull()
})

test('whole days left, never below zero', () => {
  const now = Date.UTC(2026, 0, 1)
  expect(daysLeft(now + 7.9 * 86_400_000, now)).toBe(7)
  expect(daysLeft(now - 86_400_000, now)).toBe(0)
  expect(daysLeft(null, now)).toBeNull()
})
