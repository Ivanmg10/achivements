/**
 * The link and unlink routes, user and admin, against one contract (#125, family 8; audit AP-02): each
 * still answers, writes, clears, mails and logs what it did before the SQL moved to `lib/platformLinks`.
 * What only one platform checks before the write (RA's key, Sony's privacy, Xbox's gamertag) stays in
 * each route's own test.
 */
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/raKey', () => ({ sealRaKey: (key: string) => ({ sealed: `sealed:${key}`, hash: `hash:${key}` }) }))
jest.mock('@/lib/raProfile', () => ({ ...jest.requireActual('@/lib/raProfile'), fetchRaProfile: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({ clearUserCache: jest.fn(), withSteamCache: jest.fn() }))
jest.mock('@/lib/steamUnlocks', () => ({ forgetUnlocks: jest.fn() }))
jest.mock('@/lib/steamLinkNotice', () => ({ sendSteamLinkNotice: jest.fn() }))
jest.mock('@/lib/steamClient', () => ({ getPlayerSummaries: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ onPlatformLinked: jest.fn() }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({
  ...jest.requireActual('@/lib/psnClient'),
  psnConfigured: jest.fn(),
  findPsnAccount: jest.fn(),
  psnSummary: jest.fn(),
}))
jest.mock('@/lib/xboxClient', () => ({
  ...jest.requireActual('@/lib/xboxClient'),
  xboxConfigured: jest.fn(),
  findXboxAccount: jest.fn(),
  xboxSummary: jest.fn(),
}))

import { NextRequest, NextResponse, after } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { fetchRaProfile } from '@/lib/raProfile'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUnlocks } from '@/lib/steamUnlocks'
import { sendSteamLinkNotice } from '@/lib/steamLinkNotice'
import { getPlayerSummaries } from '@/lib/steamClient'
import { forgetUser } from '@/lib/userRecord'
import { onPlatformLinked } from '@/lib/scoreRefresh'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { findPsnAccount, psnConfigured, psnSummary } from '@/lib/psnClient'
import { findXboxAccount, xboxConfigured, xboxSummary } from '@/lib/xboxClient'
import { POST as unlinkRa } from './unlinkRaUser/route'
import { POST as unlinkSteam } from './steam/unlink/route'
import { POST as unlinkPsn } from './psn/unlink/route'
import { POST as unlinkXbox } from './xbox/unlink/route'
import { POST as linkRa } from './updateRaUser/route'
import { POST as linkPsn } from './psn/link/route'
import { POST as linkXbox } from './xbox/link/route'
import { DELETE as adminUnlink, POST as adminLink } from './admin/users/accounts/route'

const ADMIN = { id: '3', username: 'boss', pwv: 'v1' }
const BOB = { id: 11, username: 'bob' }
const STEAM_ID = '76561198000000000'

const UNLINK_SQL = {
  ra: 'UPDATE users SET "raUser" = NULL, rausername = NULL, raid = NULL, raid_hash = NULL WHERE id = $1',
  steam: 'UPDATE users SET steamid = NULL, steamusername = NULL, steam_login_id = NULL WHERE id = $1',
  psn: 'UPDATE users SET psnaccountid = NULL, psnusername = NULL WHERE id = $1',
  xbox: 'UPDATE users SET xboxxuid = NULL, xboxgamertag = NULL WHERE id = $1',
}
const LINK_SQL = {
  ra: 'UPDATE users SET "raUser" = $1, rausername = $2, raid = $3, raid_hash = $4 WHERE id = $5',
  steam: 'UPDATE users SET steamid = $1, steamusername = $2 WHERE id = $3',
  psn: 'UPDATE users SET psnaccountid = $1, psnusername = $2 WHERE id = $3',
  xbox: 'UPDATE users SET xboxxuid = $1, xboxgamertag = $2 WHERE id = $3',
}

const json = (url: string, body: unknown, method = 'POST') =>
  new NextRequest(`http://localhost${url}`, { method, body: JSON.stringify(body) }) as unknown as Request
const bodyOf = (res: Response) => (res as unknown as { data: unknown }).data
const updates = () => (pool.query as jest.Mock).mock.calls.filter(([sql]) => String(sql).startsWith('UPDATE'))
const failWrites = () =>
  (pool.query as jest.Mock).mockImplementation((sql: string) =>
    sql.startsWith('SELECT') ? Promise.resolve({ rows: [BOB] }) : Promise.reject(new Error('db down')),
  )

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true } })
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
    Promise.resolve(sql.startsWith('SELECT') ? { rows: [BOB] } : { rows: [{ username: 'ana', email: 'ana@test.com' }] }),
  )
  ;(fetchRaProfile as jest.Mock).mockResolvedValue({ ok: true, profile: { User: 'BobRA' } })
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [{ personaname: 'Bobby' }] } })
  ;(psnConfigured as jest.Mock).mockResolvedValue(true)
  ;(findPsnAccount as jest.Mock).mockResolvedValue({ accountId: '42', onlineId: 'BobPS' })
  ;(psnSummary as jest.Mock).mockResolvedValue({})
  ;(xboxConfigured as jest.Mock).mockReturnValue(true)
  ;(findXboxAccount as jest.Mock).mockResolvedValue({ xuid: '2535', gamertag: 'BobX' })
  ;(xboxSummary as jest.Mock).mockResolvedValue({})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

describe.each([
  { platform: 'ra', unlink: unlinkRa, failure: { message: 'Could not unlink RA account' } },
  { platform: 'steam', unlink: unlinkSteam, failure: { message: 'Could not unlink Steam account' } },
  { platform: 'psn', unlink: unlinkPsn, failure: { message: 'Could not unlink PSN account' } },
  { platform: 'xbox', unlink: unlinkXbox, failure: { error: 'failed' } },
] as const)('a user unlinking $platform', ({ platform, unlink, failure }) => {
  test('signed out is a 401 and nothing is touched', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await unlink()).status).toBe(401)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('clears the same columns, the cache and the cached user row', async () => {
    const res = await unlink()
    expect(res.status).toBe(200)
    expect(bodyOf(res)).toEqual({ ok: true })
    const [sql, params] = updates()[0]
    expect(sql.replace(/ RETURNING .*$/, '')).toBe(UNLINK_SQL[platform])
    expect(params).toEqual(['7'])
    expect(clearUserCache).toHaveBeenCalledWith('7')
    expect(forgetUser).toHaveBeenCalledWith('7')
    if (platform === 'steam') expect(forgetUnlocks).toHaveBeenCalledWith('7')
    else expect(forgetUnlocks).not.toHaveBeenCalled()
  })

  test('a failed write is a 500 with the same body, and nothing else is touched', async () => {
    failWrites()
    const res = await unlink()
    expect(res.status).toBe(500)
    expect(bodyOf(res)).toEqual(failure)
    expect(clearUserCache).not.toHaveBeenCalled()
    expect(forgetUnlocks).not.toHaveBeenCalled()
    expect(forgetUser).not.toHaveBeenCalled()
    expect(sendSteamLinkNotice).not.toHaveBeenCalled()
  })
})

test("a user unlinking Steam is told by mail, at the account's own address", async () => {
  await unlinkSteam()
  await Promise.all((after as unknown as { pending: Promise<unknown>[] }).pending)
  expect(sendSteamLinkNotice).toHaveBeenCalledWith({ to: 'ana@test.com', username: 'ana', linked: false })
})

test('only an admin may unlink Xbox', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  expect((await unlinkXbox()).status).toBe(403)
  expect(pool.query).not.toHaveBeenCalled()
})

describe.each([
  { platform: 'ra', link: () => linkRa(json('/api/updateRaUser', { username: 'bobra', apiKey: ' key ' })), values: [JSON.stringify({ User: 'BobRA' }), 'BobRA', 'sealed:key', 'hash:key'], failure: { error: 'Internal error' } },
  { platform: 'psn', link: () => linkPsn(json('/api/psn/link', { username: 'BobPS' })), values: ['42', 'BobPS'], failure: { error: 'failed' } },
  { platform: 'xbox', link: () => linkXbox(json('/api/xbox/link', { gamertag: 'BobX' })), values: ['2535', 'BobX'], failure: { error: 'failed' } },
] as const)('a user linking $platform', ({ platform, link, values, failure }) => {
  test('writes the same SQL, forgets the cached user and scores the platform', async () => {
    expect((await link()).status).toBe(200)
    expect(updates()).toEqual([[LINK_SQL[platform], [...values, '7']]])
    expect(forgetUser).toHaveBeenCalledWith('7')
    expect(onPlatformLinked).toHaveBeenCalledWith(7, platform)
    // As before: a user's link keeps the cache (the admin's PSN, Xbox and Steam links clear it).
    expect(clearUserCache).not.toHaveBeenCalled()
  })

  test('a failed write is a 500 with the same body, and nothing is scored', async () => {
    failWrites()
    const res = await link()
    expect(res.status).toBe(500)
    expect(bodyOf(res)).toEqual(failure)
    expect(forgetUser).not.toHaveBeenCalled()
    expect(onPlatformLinked).not.toHaveBeenCalled()
  })
})

test('signed out, no link route writes', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  for (const link of [
    () => linkRa(json('/api/updateRaUser', { username: 'bobra', apiKey: 'key' })),
    () => linkPsn(json('/api/psn/link', { username: 'BobPS' })),
    () => linkXbox(json('/api/xbox/link', { gamertag: 'BobX' })),
  ]) expect((await link()).status).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

describe.each(['ra', 'steam', 'psn', 'xbox'] as const)('an admin unlinking %s', (platform) => {
  const del = () => adminUnlink(json(`/api/admin/users/accounts?id=11&platform=${platform}`, undefined, 'DELETE'))

  test('a locked panel gets the auth answer, and nothing is touched', async () => {
    const locked = NextResponse.json({ error: 'reauth-required' }, { status: 403 })
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: locked })
    expect(await del()).toBe(locked)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('clears the same columns and housekeeping as the user route, logs it, and mails no one', async () => {
    const res = await del()
    expect(res.status).toBe(200)
    expect(bodyOf(res)).toEqual({ ok: true })
    expect(updates()).toEqual([[UNLINK_SQL[platform], [11]]])
    expect(clearUserCache).toHaveBeenCalledWith('11')
    expect(forgetUser).toHaveBeenCalledWith(11)
    if (platform === 'steam') expect(forgetUnlocks).toHaveBeenCalledWith('11')
    else expect(forgetUnlocks).not.toHaveBeenCalled()
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, `unlink-${platform}`, BOB)
    expect(sendSteamLinkNotice).not.toHaveBeenCalled()
  })

  test('a failed write is a 500 and nothing is logged', async () => {
    failWrites()
    const res = await del()
    expect(res.status).toBe(500)
    expect(bodyOf(res)).toEqual({ error: 'Internal error' })
    expect(clearUserCache).not.toHaveBeenCalled()
    expect(logAdminAction).not.toHaveBeenCalled()
  })
})

describe.each([
  { platform: 'ra', body: { username: 'bobra', apiKey: ' key ' }, values: [JSON.stringify({ User: 'BobRA' }), 'BobRA', 'sealed:key', 'hash:key'], clears: false, log: { rausername: 'BobRA' } },
  { platform: 'steam', body: { steamid: STEAM_ID }, values: [STEAM_ID, 'Bobby'], clears: true, log: { steamid: STEAM_ID, steamusername: 'Bobby' } },
  { platform: 'psn', body: { username: 'BobPS' }, values: ['42', 'BobPS'], clears: true, log: { psnaccountid: '42', psnusername: 'BobPS' } },
  { platform: 'xbox', body: { gamertag: 'BobX' }, values: ['2535', 'BobX'], clears: true, log: { xboxxuid: '2535', xboxgamertag: 'BobX' } },
] as const)('an admin linking $platform', ({ platform, body, values, clears, log }) => {
  const link = () => adminLink(json('/api/admin/users/accounts', { id: 11, platform, ...body }))

  test('a locked panel gets the auth answer, and nothing is touched', async () => {
    const locked = NextResponse.json({ error: 'reauth-required' }, { status: 403 })
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: locked })
    expect(await link()).toBe(locked)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('writes the same SQL, with the same housekeeping, and logs it', async () => {
    expect((await link()).status).toBe(200)
    expect(updates()).toEqual([[LINK_SQL[platform], [...values, 11]]])
    expect(forgetUser).toHaveBeenCalledWith(11)
    if (clears) expect(clearUserCache).toHaveBeenCalledWith('11')
    else expect(clearUserCache).not.toHaveBeenCalled()
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, `link-${platform}`, BOB, log)
    // An admin's link is not the user's: it neither proves a sign-in nor scores the platform at once.
    expect(onPlatformLinked).not.toHaveBeenCalled()
  })

  test('a failed write is a 500 and nothing is logged', async () => {
    failWrites()
    const res = await link()
    expect(res.status).toBe(500)
    expect(bodyOf(res)).toEqual({ error: 'Internal error' })
    expect(logAdminAction).not.toHaveBeenCalled()
  })
})
