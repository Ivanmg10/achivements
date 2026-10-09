jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/raProfile', () => ({ ...jest.requireActual('@/lib/raProfile'), fetchRaProfile: jest.fn() }))
jest.mock('@/lib/steamClient', () => ({ getPlayerSummaries: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({ clearUserCache: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({
  findPsnAccount: jest.fn(),
  psnConfigured: jest.fn(),
  psnSummary: jest.fn(),
  psnFailure: jest.fn(() => jest.requireActual('next/server').NextResponse.json({ error: 'private' }, { status: 403 })),
}))

import { DELETE, POST } from './route'
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { fetchRaProfile } from '@/lib/raProfile'
import { getPlayerSummaries } from '@/lib/steamClient'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUser } from '@/lib/userRecord'
import { findPsnAccount, psnConfigured, psnSummary } from '@/lib/psnClient'

const ADMIN = { id: '3', username: 'boss', pwv: 'v1' }
const BOB = { id: 11, username: 'bob' }
const STEAM_ID = '76561198000000000'

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/admin/users/accounts', { method: 'POST', body: JSON.stringify(body) }) as unknown as Request
const del = (query: string) =>
  new NextRequest(`http://localhost/api/admin/users/accounts?${query}`, { method: 'DELETE' }) as unknown as Request
const updates = () => (pool.query as jest.Mock).mock.calls.filter(([sql]) => String(sql).startsWith('UPDATE'))

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
    Promise.resolve(sql.startsWith('SELECT') ? { rows: [BOB] } : { rows: [] }),
  )
})

test('a locked panel gets the auth answer, and nothing is touched', async () => {
  const locked = NextResponse.json({ error: 'reauth-required' }, { status: 403 })
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: locked })
  expect(await POST(post({ id: 11, platform: 'steam', steamid: STEAM_ID }))).toBe(locked)
  expect(await DELETE(del('id=11&platform=ra'))).toBe(locked)
  expect(pool.query).not.toHaveBeenCalled()
})

test('404 for a user that does not exist, 400 for a bad id or platform', async () => {
  expect((await POST(post({ id: 'x', platform: 'ra' }))).status).toBe(400)
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  expect((await POST(post({ id: 99, platform: 'ra', username: 'a', apiKey: 'b' }))).status).toBe(404)
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [BOB] })
  expect((await POST(post({ id: 11, platform: 'xbox' }))).status).toBe(400)
  expect((await DELETE(del('id=11&platform=xbox'))).status).toBe(400)
})

describe('RetroAchievements', () => {
  test('links only what RA accepts, and logs it', async () => {
    ;(fetchRaProfile as jest.Mock).mockResolvedValue({ ok: true, profile: { User: 'BobRA' } })
    const res = await POST(post({ id: 11, platform: 'ra', username: ' bobra ', apiKey: ' key ' }))
    expect(res.status).toBe(200)
    expect(fetchRaProfile).toHaveBeenCalledWith('bobra', 'key')
    expect(updates()[0][1]).toEqual([JSON.stringify({ User: 'BobRA' }), 'BobRA', 'key', 11])
    expect(forgetUser).toHaveBeenCalledWith(11)
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'link-ra', BOB, { rausername: 'BobRA' })
  })

  test('a username or key RA refuses is not stored', async () => {
    ;(fetchRaProfile as jest.Mock).mockResolvedValue({ ok: false, error: 'ra-invalid', status: 400 })
    expect((await POST(post({ id: 11, platform: 'ra', username: 'bob', apiKey: 'bad' }))).status).toBe(400)
    expect(updates()).toHaveLength(0)
  })

  test('missing credentials are refused before asking RA', async () => {
    expect((await POST(post({ id: 11, platform: 'ra', username: 'bob' }))).status).toBe(400)
    expect(fetchRaProfile).not.toHaveBeenCalled()
  })

  test('a key already linked elsewhere is a 409', async () => {
    ;(fetchRaProfile as jest.Mock).mockResolvedValue({ ok: true, profile: { User: 'BobRA' } })
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      sql.startsWith('SELECT') ? Promise.resolve({ rows: [BOB] }) : Promise.reject(Object.assign(new Error('dup'), { code: '23505' })),
    )
    expect((await POST(post({ id: 11, platform: 'ra', username: 'bob', apiKey: 'key' }))).status).toBe(409)
    expect(logAdminAction).not.toHaveBeenCalled()
  })

  test('unlinking clears the account and logs it', async () => {
    expect((await DELETE(del('id=11&platform=ra'))).status).toBe(200)
    expect(updates()[0][0]).toContain('raid = NULL')
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'unlink-ra', BOB)
  })
})

describe('Steam', () => {
  test('links a profile Steam knows, from the ID or a profile link, and logs it', async () => {
    ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [{ personaname: 'Bobby' }] } })
    const res = await POST(post({ id: 11, platform: 'steam', steamid: `https://steamcommunity.com/profiles/${STEAM_ID}/` }))
    expect(res.status).toBe(200)
    expect(getPlayerSummaries).toHaveBeenCalledWith(STEAM_ID, 'steam-key')
    expect(updates()[0][1]).toEqual([STEAM_ID, 'Bobby', 11])
    expect(clearUserCache).toHaveBeenCalledWith('11')
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'link-steam', BOB, { steamid: STEAM_ID, steamusername: 'Bobby' })
  })

  test('an ID that is not a SteamID64 is refused before asking Steam', async () => {
    expect((await POST(post({ id: 11, platform: 'steam', steamid: 'gaben' }))).status).toBe(400)
    expect(getPlayerSummaries).not.toHaveBeenCalled()
  })

  test('a profile Steam does not know is not stored', async () => {
    ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [] } })
    expect((await POST(post({ id: 11, platform: 'steam', steamid: STEAM_ID }))).status).toBe(400)
    expect(updates()).toHaveLength(0)
  })

  test('Steam being down is a 502, and nothing changes', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(getPlayerSummaries as jest.Mock).mockRejectedValue(new Error('down'))
    expect((await POST(post({ id: 11, platform: 'steam', steamid: STEAM_ID }))).status).toBe(502)
    expect(updates()).toHaveLength(0)
  })

  test('a Steam account linked to someone else links here too', async () => {
    ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [{ personaname: 'Bobby' }] } })
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      sql.startsWith('SELECT') ? Promise.resolve({ rows: [BOB] }) : Promise.resolve({ rowCount: 1 }),
    )
    expect((await POST(post({ id: 11, platform: 'steam', steamid: STEAM_ID }))).status).toBe(200)
  })

  test('without a Steam API key it cannot check, so it does not link', async () => {
    delete process.env.STEAM_API_KEY
    expect((await POST(post({ id: 11, platform: 'steam', steamid: STEAM_ID }))).status).toBe(503)
  })

  test('unlinking clears the account and its cache, and logs it', async () => {
    expect((await DELETE(del('id=11&platform=steam'))).status).toBe(200)
    expect(updates()[0][0]).toContain('steamid = NULL')
    expect(clearUserCache).toHaveBeenCalledWith('11')
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'unlink-steam', BOB)
  })
})

describe('PSN', () => {
  beforeEach(() => {
    ;(psnConfigured as jest.Mock).mockResolvedValue(true)
    ;(findPsnAccount as jest.Mock).mockResolvedValue({ accountId: '123', onlineId: 'BobPS' })
    ;(psnSummary as jest.Mock).mockResolvedValue({})
  })

  test('links an online ID Sony knows and whose trophies are readable, and logs it', async () => {
    const res = await POST(post({ id: 11, platform: 'psn', username: ' BobPS ' }))
    expect(res.status).toBe(200)
    expect(findPsnAccount).toHaveBeenCalledWith('BobPS')
    expect(updates()[0][1]).toEqual(['123', 'BobPS', 11])
    expect(clearUserCache).toHaveBeenCalledWith('11')
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'link-psn', BOB, { psnaccountid: '123', psnusername: 'BobPS' })
  })

  test('a malformed online ID is refused before asking Sony', async () => {
    expect((await POST(post({ id: 11, platform: 'psn', username: 'a b' }))).status).toBe(400)
    expect(findPsnAccount).not.toHaveBeenCalled()
  })

  test('an unknown online ID is a 404 and nothing is stored', async () => {
    ;(findPsnAccount as jest.Mock).mockResolvedValue(null)
    expect((await POST(post({ id: 11, platform: 'psn', username: 'Nobody' }))).status).toBe(404)
    expect(updates()).toHaveLength(0)
  })

  test('private trophies are refused and nothing is stored', async () => {
    ;(psnSummary as jest.Mock).mockRejectedValue(new Error('private'))
    expect((await POST(post({ id: 11, platform: 'psn', username: 'BobPS' }))).status).toBe(403)
    expect(updates()).toHaveLength(0)
  })

  test('without PSN configured it cannot check, so it does not link', async () => {
    ;(psnConfigured as jest.Mock).mockResolvedValue(false)
    expect((await POST(post({ id: 11, platform: 'psn', username: 'BobPS' }))).status).toBe(503)
  })

  test('unlinking clears the account and its cache, and logs it', async () => {
    expect((await DELETE(del('id=11&platform=psn'))).status).toBe(200)
    expect(updates()[0][0]).toContain('psnaccountid = NULL')
    expect(clearUserCache).toHaveBeenCalledWith('11')
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'unlink-psn', BOB)
  })
})
