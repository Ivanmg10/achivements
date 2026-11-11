jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/raKey', () => ({ sealRaKey: (key: string) => ({ sealed: `sealed:${key}`, hash: `hash:${key}` }) }))
jest.mock('@/lib/steamCache', () => ({ clearUserCache: jest.fn() }))
jest.mock('@/lib/steamUnlocks', () => ({ forgetUnlocks: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import pool from '@/lib/db'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUnlocks } from '@/lib/steamUnlocks'
import { forgetUser } from '@/lib/userRecord'
import { PSN_ONLINE_ID, linkSql, saveLink, saveRaLink, unlinkPlatform, unlinkSql } from './platformLinks'

beforeEach(() => {
  jest.clearAllMocks()
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

// The exact text each route wrote by hand before #125 (family 8): joining them must not change one character.
test.each([
  ['ra', 'UPDATE users SET "raUser" = $1, rausername = $2, raid = $3, raid_hash = $4 WHERE id = $5'],
  ['steam', 'UPDATE users SET steamid = $1, steamusername = $2 WHERE id = $3'],
  ['psn', 'UPDATE users SET psnaccountid = $1, psnusername = $2 WHERE id = $3'],
  ['xbox', 'UPDATE users SET xboxxuid = $1, xboxgamertag = $2 WHERE id = $3'],
] as const)('the %s link writes the same SQL as before', (platform, sql) => {
  expect(linkSql(platform)).toBe(sql)
})

test.each([
  ['ra', 'UPDATE users SET "raUser" = NULL, rausername = NULL, raid = NULL, raid_hash = NULL WHERE id = $1'],
  ['steam', 'UPDATE users SET steamid = NULL, steamusername = NULL, steam_login_id = NULL WHERE id = $1'],
  ['psn', 'UPDATE users SET psnaccountid = NULL, psnusername = NULL WHERE id = $1'],
  ['xbox', 'UPDATE users SET xboxxuid = NULL, xboxgamertag = NULL WHERE id = $1'],
] as const)('the %s unlink clears the same columns as before', (platform, sql) => {
  expect(unlinkSql(platform)).toBe(sql)
})

test("Steam's user unlink reads back who to mail", () => {
  expect(unlinkSql('steam', true)).toBe(
    'UPDATE users SET steamid = NULL, steamusername = NULL, steam_login_id = NULL WHERE id = $1 RETURNING username, email',
  )
})

test('every value is a parameter: the RA key is stored sealed, with its hash', async () => {
  await saveRaLink(7, { User: 'Ivan' }, 'key')
  expect(pool.query).toHaveBeenCalledWith(linkSql('ra'), [JSON.stringify({ User: 'Ivan' }), 'Ivan', 'sealed:key', 'hash:key', 7])
  await saveLink('7', 'psn', "1'; DROP TABLE users; --", 'x')
  expect(pool.query).toHaveBeenLastCalledWith(linkSql('psn'), ["1'; DROP TABLE users; --", 'x', '7'])
})

test.each(['ra', 'psn', 'xbox'] as const)('unlinking %s clears the cache and the cached user, not Steam unlocks', async (platform) => {
  expect(await unlinkPlatform(7, platform)).toBeNull()
  expect(clearUserCache).toHaveBeenCalledWith('7')
  expect(forgetUser).toHaveBeenCalledWith(7)
  expect(forgetUnlocks).not.toHaveBeenCalled()
})

test('unlinking Steam also forgets its kept unlocks and play time, and answers the row read back', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ username: 'ana', email: 'a@b.c' }] })
  expect(await unlinkPlatform('7', 'steam', true)).toEqual({ username: 'ana', email: 'a@b.c' })
  expect(forgetUnlocks).toHaveBeenCalledWith('7')
  expect(clearUserCache).toHaveBeenCalledWith('7')
})

test('a failed write throws before anything else is touched', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  await expect(unlinkPlatform('7', 'steam')).rejects.toThrow('db down')
  expect(clearUserCache).not.toHaveBeenCalled()
  expect(forgetUnlocks).not.toHaveBeenCalled()
  expect(forgetUser).not.toHaveBeenCalled()
})

test('one online ID rule for the user and the admin route', () => {
  expect(PSN_ONLINE_ID.test('Hako_om-1')).toBe(true)
  for (const bad of ['ab', 'has space', 'x'.repeat(17), 'ñandú']) expect(PSN_ONLINE_ID.test(bad)).toBe(false)
})
