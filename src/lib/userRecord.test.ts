jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { forgetUser, loadUser, loadUserByUsername, loadUserSynced, passwordVersion } from './userRecord'

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

describe('loadUserSynced', () => {
  test('says when the row was read', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(2_000_000)
    await expect(loadUserSynced(1)).resolves.toEqual({ row, at: 2_000_000 })
    now.mockRestore()
  })

  test('a cached row older than the session’s last sync is read again', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(3_000_000)
    await loadUserSynced(1)
    now.mockReturnValue(3_000_010)
    // Another instance put a newer row in the token at 3_000_005.
    const { at } = await loadUserSynced(1, { notBefore: 3_000_005 })
    expect(query).toHaveBeenCalledTimes(2)
    expect(at).toBe(3_000_010)
    now.mockRestore()
  })

  test('a cached row at least as new as the session is reused', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(4_000_000)
    await loadUserSynced(1)
    now.mockReturnValue(4_000_010)
    await loadUserSynced(1, { notBefore: 4_000_000 })
    expect(query).toHaveBeenCalledTimes(1)
    now.mockRestore()
  })
})
