/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn() }))

import pool from '@/lib/db'
import { reserveAttempt } from '@/lib/attemptLimit'
import { seal } from '@/lib/secretBox'
import { totpCode } from '@/lib/totp'
import { checkSecondFactor } from './adminTotp'

const SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const query = pool.query as jest.Mock
const release = jest.fn()
const codeNow = () => totpCode(SECRET, Math.floor(Date.now() / 30_000))
const stored = (over = {}) => ({ secret: seal(SECRET, 'admin-totp'), confirmed_at: '2026-10-31', ...over })

/** The row, then whatever the updates answer. */
function answers(row: object | null, ...updates: object[]) {
  query.mockReset()
  query.mockResolvedValueOnce({ rows: row ? [row] : [] })
  for (const update of updates) query.mockResolvedValueOnce(update)
  query.mockResolvedValue({ rows: [] })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  ;(reserveAttempt as jest.Mock).mockResolvedValue({ allowed: true, release })
})

test('an admin with no second factor is given a key, and the panel stays shut', async () => {
  answers(null)
  const result = await checkSecondFactor('3', 'boss', undefined)
  expect(result).toMatchObject({ state: 'setup', wrong: false })
  const insert = query.mock.calls[1]
  expect(insert[0]).toContain('INSERT INTO admin_totp')
  expect(insert[1][1]).not.toContain((result as { key: string }).key)
})

test('the key is kept while enrolling, and a wrong code says so', async () => {
  answers(stored({ confirmed_at: null }))
  expect(await checkSecondFactor('3', 'boss', '000000')).toMatchObject({ state: 'setup', key: SECRET, wrong: true })
  expect(query).toHaveBeenCalledTimes(1)
})

test('the first good code finishes enrolling and hands out recovery codes, stored hashed', async () => {
  answers(stored({ confirmed_at: null }))
  const result = await checkSecondFactor('3', 'boss', codeNow())
  expect(result.state).toBe('ok')
  const codes = (result as { recoveryCodes: string[] }).recoveryCodes
  expect(codes).toHaveLength(8)
  expect(codes[0]).toMatch(/^[0-9a-f]{5}-[0-9a-f]{5}$/)
  const saved = query.mock.calls[1][1][2] as string[]
  expect(saved).not.toContain(codes[0])
})

test('once enrolled a code is required', async () => {
  answers(stored())
  expect(await checkSecondFactor('3', 'boss', '')).toEqual({ state: 'required' })
})

test('a good code opens, and does not count against the limit', async () => {
  answers(stored(), { rows: [{ user_id: 3 }] })
  expect(await checkSecondFactor('3', 'boss', codeNow())).toEqual({ state: 'ok' })
  expect(release).toHaveBeenCalled()
})

test('a code already used is refused, and the attempt counts', async () => {
  answers(stored(), { rows: [] }, { rows: [] })
  expect(await checkSecondFactor('3', 'boss', codeNow())).toEqual({ state: 'wrong' })
  expect(release).not.toHaveBeenCalled()
})

test('a recovery code works once', async () => {
  answers(stored(), { rows: [{ user_id: 3 }] })
  expect(await checkSecondFactor('3', 'boss', 'abcde-12345')).toEqual({ state: 'ok' })
  expect(query.mock.calls[1][0]).toContain('array_remove')
})

test('too many tries stop checking', async () => {
  answers(stored())
  ;(reserveAttempt as jest.Mock).mockResolvedValue({ allowed: false, release })
  expect(await checkSecondFactor('3', 'boss', codeNow())).toEqual({ state: 'too-many' })
  expect(release).toHaveBeenCalled()
})
