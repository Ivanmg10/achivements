jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { claimToken, createResetToken, hashToken, resetUrl } from './passwordReset'
import pool from '@/lib/db'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  query.mockResolvedValue({ rows: [] })
})

test('a new token retires the ones that user already had', async () => {
  const token = await createResetToken(7)
  expect(token).toHaveLength(64)
  expect(query.mock.calls[0][0]).toContain('DELETE FROM password_resets')
  expect(query.mock.calls[0][1]).toEqual([7])
})

test('only the hash of the token reaches the database', async () => {
  const token = await createResetToken(7)
  const [, params] = query.mock.calls[1]
  expect(params[1]).toBe(hashToken(token))
  expect(params[1]).not.toBe(token)
})

test('each token is different', async () => {
  const a = await createResetToken(1)
  const b = await createResetToken(1)
  expect(a).not.toBe(b)
})

test('claiming a live token names its user; anything else does not', async () => {
  query.mockResolvedValueOnce({ rows: [{ user_id: 3 }] })
  await expect(claimToken('abc')).resolves.toBe(3)

  query.mockResolvedValueOnce({ rows: [] })
  await expect(claimToken('abc')).resolves.toBeNull()
})

test('claiming checks and spends the token in one statement, so a race cannot use it twice', async () => {
  query.mockResolvedValueOnce({ rows: [] })
  await claimToken('abc')
  expect(query).toHaveBeenCalledTimes(1)
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('SET used_at = NOW()')
  expect(sql).toContain('used_at IS NULL')
  expect(sql).toContain('expires_at > NOW()')
  expect(sql).toContain('RETURNING user_id')
  expect(params).toEqual([hashToken('abc')])
})

test('the link points at the reset page on this deployment', () => {
  process.env.NEXTAUTH_URL = 'https://cheevovault.app/'
  expect(resetUrl('abc')).toBe('https://cheevovault.app/resetPassword?token=abc')
  delete process.env.NEXTAUTH_URL
})
