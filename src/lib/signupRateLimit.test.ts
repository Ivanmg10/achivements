jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { allowSignup, clientAddress } from './signupRateLimit'
import pool from '@/lib/db'

const query = pool.query as jest.Mock

/** First call counts what is recent, second inserts, a third may clean up. */
function recent(count: number) {
  query.mockReset()
  query.mockResolvedValueOnce({ rows: [{ recent: count }] }).mockResolvedValue({ rows: [] })
}

beforeEach(() => {
  jest.spyOn(Math, 'random').mockReturnValue(0.9) // skip the housekeeping delete
})

afterEach(() => (Math.random as jest.Mock).mockRestore())

test('allows an address under the limit, and records the attempt', async () => {
  recent(4)
  await expect(allowSignup('1.2.3.4')).resolves.toBe(true)
  expect(query.mock.calls[1][0]).toContain('INSERT INTO signup_attempts')
  expect(query.mock.calls[1][1]).toEqual(['1.2.3.4'])
})

test('stops an address that already made five in the window', async () => {
  recent(5)
  await expect(allowSignup('1.2.3.4')).resolves.toBe(false)
  expect(query).toHaveBeenCalledTimes(1)
})

test('counts only the last hour, for that address', async () => {
  recent(0)
  await allowSignup('1.2.3.4')
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('created_at > NOW()')
  expect(params).toEqual(['1.2.3.4', '60'])
})

test('clears out old rows now and then', async () => {
  ;(Math.random as jest.Mock).mockReturnValue(0.01)
  recent(0)
  await allowSignup('1.2.3.4')
  expect(query.mock.calls[2][0]).toContain('DELETE FROM signup_attempts')
})

test('a database that will not answer does not block sign-ups', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  query.mockReset()
  query.mockRejectedValue(new Error('db down'))
  await expect(allowSignup('1.2.3.4')).resolves.toBe(true)
})

describe('clientAddress', () => {
  test('takes the first address a proxy forwarded', () => {
    expect(clientAddress(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9')
  })

  test('falls back to x-real-ip, then to a placeholder', () => {
    expect(clientAddress(new Headers({ 'x-real-ip': '8.8.8.8' }))).toBe('8.8.8.8')
    expect(clientAddress(new Headers())).toBe('unknown')
  })
})
