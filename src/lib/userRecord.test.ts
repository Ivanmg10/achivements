jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { forgetUser, loadUser, loadUserByUsername, passwordVersion } from './userRecord'

const query = pool.query as jest.Mock
const row = { id: 1, username: 'ivan', password: '$2b$10$hash' }

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ rows: [row] })
  forgetUser(1)
})

test('loads a user by id', async () => {
  await expect(loadUser('1')).resolves.toEqual(row)
  expect(query.mock.calls[0][1]).toEqual(['1'])
})

test('a second read within the minute comes from the cache', async () => {
  await loadUser(1)
  await loadUser('1')
  expect(query).toHaveBeenCalledTimes(1)
})

test('fresh skips the cache', async () => {
  await loadUser(1)
  await loadUser(1, { fresh: true })
  expect(query).toHaveBeenCalledTimes(2)
})

test('forgetUser makes the next read go to the database', async () => {
  await loadUser(1)
  forgetUser('1')
  await loadUser(1)
  expect(query).toHaveBeenCalledTimes(2)
})

test('the cache expires after a minute', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000)
  await loadUser(1)
  now.mockReturnValue(1_000_000 + 61_000)
  await loadUser(1)
  expect(query).toHaveBeenCalledTimes(2)
  now.mockRestore()
})

test('a user that does not exist is null, and that is cached too', async () => {
  query.mockResolvedValue({ rows: [] })
  await expect(loadUser(99)).resolves.toBeNull()
  await expect(loadUser(99)).resolves.toBeNull()
  expect(query).toHaveBeenCalledTimes(1)
  forgetUser(99)
})

test('a database error propagates and is not cached', async () => {
  query.mockRejectedValueOnce(new Error('db down'))
  await expect(loadUser(1)).rejects.toThrow('db down')
  await expect(loadUser(1)).resolves.toEqual(row)
})

test('loads by exact username, bypassing the cache', async () => {
  await loadUserByUsername('ivan')
  await loadUserByUsername('ivan')
  expect(query).toHaveBeenCalledTimes(2)
  expect(query.mock.calls[0][0]).toContain('WHERE username = $1')
})

test('passwordVersion is stable, short, and changes with the hash', () => {
  expect(passwordVersion('a')).toBe(passwordVersion('a'))
  expect(passwordVersion('a')).toHaveLength(16)
  expect(passwordVersion('a')).not.toBe(passwordVersion('b'))
  expect(passwordVersion('$2b$10$hash')).not.toContain('$2b$')
})
