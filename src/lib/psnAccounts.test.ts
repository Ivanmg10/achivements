/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn(), connect: jest.fn() } }))

import pool from '@/lib/db'
import {
  canaryDue,
  deletePsnAccount,
  dropPsnAccessToken,
  finishPsnLease,
  insertPsnAccount,
  leasePsnAccount,
  listPsnAccounts,
  loadPoolAccount,
  lockPsnTokens,
  markPsnWarned,
  npssoExpiry,
  openPsn,
  psnPoolState,
  recordPsnCanary,
  releasePsnLease,
  renewPsnAccount,
  seedPsnPool,
  sealPsn,
  tidyPsnPool,
  updatePsnAccount,
} from './psnAccounts'
import { AUTH_FAILED, PsnError } from './psnErrors'

const query = pool.query as jest.Mock
const SIGN_IN = {
  npsso: 'n'.repeat(64),
  expiresAt: 1_800_000_000_000,
  tokens: { accessToken: 'access', accessExpiresAt: 1, refreshToken: 'refresh', refreshExpiresAt: 2 },
  onlineId: 'ServiceTwo',
  avatarUrl: null,
}
const LEASE = { account: { id: 2, label: 'PSN-2', ratePerMin: 40 }, slot: 1 }
const sql = (i = 0) => String(query.mock.calls[i][0])

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.PSN_SECRET_KEY = 'psn-key'
  query.mockResolvedValue({ rows: [], rowCount: 1 })
})

afterEach(() => delete process.env.PSN_SECRET_KEY)

test('a lease is a weighted pick of a free slot on a usable account, never one tried', async () => {
  query.mockResolvedValueOnce({ rows: [{ account_id: 2, slot: 1, label: 'PSN-2', rate_per_min: 40 }] })
  expect(await leasePsnAccount([1])).toEqual(LEASE)
  expect(sql()).toContain("a.status = 'active'")
  expect(sql()).toContain('/ a.weight')
  expect(query.mock.calls[0][1]).toEqual([[1], 30])
  query.mockResolvedValueOnce({ rows: [] })
  expect(await leasePsnAccount([])).toBeNull()
})

test('why no slot: none set up, all busy, or none usable', async () => {
  query.mockResolvedValueOnce({ rows: [{ configured: 0, ready: 0 }] })
  expect(await psnPoolState()).toBe('empty')
  query.mockResolvedValueOnce({ rows: [{ configured: 2, ready: 1 }] })
  expect(await psnPoolState()).toBe('busy')
  query.mockResolvedValueOnce({ rows: [{ configured: 2, ready: 0 }] })
  expect(await psnPoolState([1])).toBe('resting')
})

test('finishing a lease frees the slot and records the outcome in one statement', async () => {
  await finishPsnLease(LEASE, 'rate-limited')
  expect(sql()).toContain('DELETE FROM psn_account_leases')
  expect(sql()).toContain('INSERT INTO psn_account_stats')
  expect(query.mock.calls[0][1]).toEqual([2, 1, 'rate-limited'])
  await releasePsnLease(LEASE)
  expect(query.mock.calls[1][1]).toEqual([2, 1])
})

test('sealed with PSN_SECRET_KEY when set (v1), the old derivation without; both open', () => {
  const sealed = sealPsn('npsso')
  expect(sealed.startsWith('v1:')).toBe(true)
  expect(openPsn(sealed)).toBe('npsso')
  delete process.env.PSN_SECRET_KEY
  expect(openPsn(sealPsn('legacy'))).toBe('legacy')
  expect(openPsn(null)).toBeNull()
})

test('adding and renewing store the NPSSO and tokens sealed, never in clear', async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 5 }] })
  expect(await insertPsnAccount({ label: 'PSN-2', hint: null, weight: 2, by: 'ivan' }, SIGN_IN)).toBe(5)
  const values = query.mock.calls[0][1] as unknown[]
  expect(values).not.toContain(SIGN_IN.npsso)
  expect(values).not.toContain('access')
  expect(openPsn(values[5] as string)).toBe(SIGN_IN.npsso)

  query.mockClear()
  expect(await renewPsnAccount(5, 'ivan', SIGN_IN)).toBe(true)
  expect(query.mock.calls[0][1]).not.toContain(SIGN_IN.npsso)
  expect(sql(0)).toContain("WHEN status = 'quarantined' THEN 'active'")
  expect(sql(1)).toContain('DELETE FROM psn_alert_state')
  query.mockResolvedValueOnce({ rowCount: 0 })
  expect(await renewPsnAccount(9, 'ivan', SIGN_IN)).toBe(false)
})

test('changing, removing, loading', async () => {
  expect(await updatePsnAccount(2, { status: 'paused', hint: null })).toBe(true)
  expect(query.mock.calls[0][1]).toEqual([2, 'paused', null, null, null, true, null])
  query.mockResolvedValueOnce({ rowCount: 0 })
  expect(await deletePsnAccount(9)).toBe(false)
  expect(await deletePsnAccount(2)).toBe(true)
  query.mockResolvedValueOnce({ rows: [{ id: 2, label: 'PSN-2', rate_per_min: 30 }] })
  expect(await loadPoolAccount(2)).toEqual({ id: 2, label: 'PSN-2', ratePerMin: 30 })
  query.mockResolvedValueOnce({ rows: [] })
  expect(await loadPoolAccount(3)).toBeNull()
})

test('the list for the panel never selects a secret', async () => {
  query.mockResolvedValueOnce({
    rows: [{ id: 1, label: 'PSN-1', hint: null, online_id: 'One', avatar_url: null, status: 'active', weight: 1, concurrency: 4, rate_per_min: 40, npsso_expires_at: new Date(10), renewed_at: null, renewed_by: null, last_ok_at: null, last_error: null, cooldown_until: null, canary_at: null, canary_ok: null, warned_at: null, calls: '12', rate_limited: '1' }],
  })
  const [a] = await listPsnAccounts()
  expect(a).toMatchObject({ label: 'PSN-1', npssoExpiresAt: 10, callsLastHour: 12, rateLimitedLastHour: 1 })
  expect(sql()).not.toMatch(/a\.(npsso|access_token|refresh_token)\b,/)
})

test('canary, warnings and upkeep', async () => {
  await recordPsnCanary(2, null)
  expect(query.mock.calls[0][1]).toEqual([2, false, null, null])
  query.mockResolvedValueOnce({ rows: [{ id: 2, label: 'PSN-2', rate_per_min: 40 }] })
  expect(await canaryDue(1_800_000)).toEqual([{ id: 2, label: 'PSN-2', ratePerMin: 40 }])
  await markPsnWarned([1, 2])
  await tidyPsnPool()
  await dropPsnAccessToken(2)
  expect(query.mock.calls.map((c) => String(c[0])).join()).toContain("status = 'paused'")
})

describe('seeding the pool from today', () => {
  test("copies the old row's sealed values as they are; else the variable, with Sony's expiry", async () => {
    process.env.PSN_NPSSO = 'env-npsso'
    global.fetch = jest.fn(async () => ({ ok: false })) as unknown as typeof fetch
    query.mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({ rows: [{ configured: 0, ready: 0 }] })
    await seedPsnPool()
    expect(sql(0)).toContain('FROM psn_credentials')
    expect(sql(2)).toContain("'PSN_NPSSO'")
    expect(openPsn(query.mock.calls[2][1][0])).toBe('env-npsso')
    delete process.env.PSN_NPSSO
  })

  test('a missing old table is nothing to copy; any other error is thrown', async () => {
    query.mockRejectedValueOnce(Object.assign(new Error('gone'), { code: '42P01' }))
    await expect(seedPsnPool()).resolves.toBeUndefined()
    query.mockRejectedValueOnce(Object.assign(new Error('down'), { code: '57P01' }))
    await expect(seedPsnPool()).rejects.toThrow('down')
  })
})

describe('the tokens under lock', () => {
  const client = { query: jest.fn(), release: jest.fn() }
  beforeEach(() => {
    client.query.mockReset().mockResolvedValue({ rows: [] })
    ;(pool.connect as jest.Mock).mockResolvedValue(client)
  })
  const row = () => ({ npsso: sealPsn('npsso'), access_token: null, access_expires_at: null, refresh_token: null, refresh_expires_at: null })

  test('reads the row FOR UPDATE, stores new tokens sealed, commits', async () => {
    client.query.mockImplementation(async (text: string) => (text.includes('FOR UPDATE') ? { rows: [row()] } : { rows: [] }))
    const tokens = await lockPsnTokens(1, async (secrets) => {
      expect(secrets).toEqual({ npsso: 'npsso', tokens: null })
      return SIGN_IN.tokens
    })
    expect(tokens).toBe(SIGN_IN.tokens)
    const texts = client.query.mock.calls.map((c) => String(c[0]))
    expect(texts[0]).toBe('BEGIN')
    expect(texts.some((t) => t.includes('UPDATE psn_service_accounts SET npsso'))).toBe(true)
    expect(texts.at(-1)).toBe('COMMIT')
    expect(client.release).toHaveBeenCalled()
  })

  test('a refused sign-in quarantines the account', async () => {
    client.query.mockImplementation(async (text: string) => (text.includes('FOR UPDATE') ? { rows: [row()] } : { rows: [] }))
    await expect(lockPsnTokens(1, async () => Promise.reject(new PsnError('no', AUTH_FAILED)))).rejects.toMatchObject({ code: AUTH_FAILED })
    expect(client.query.mock.calls.map((c) => String(c[0])).some((t) => t.includes("status = 'quarantined'"))).toBe(true)
  })

  test('a removed account is not configured', async () => {
    await expect(lockPsnTokens(1, async () => SIGN_IN.tokens)).rejects.toThrow('removed')
  })
})

test("Sony's NPSSO page gives the expiry; anything else is null", async () => {
  const npsso = 'x'.repeat(64)
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ npsso, expires_in: 100 }) })) as unknown as typeof fetch
  expect(await npssoExpiry(npsso)).toBeGreaterThan(Date.now())
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ npsso: 'other', expires_in: 100 }) })) as unknown as typeof fetch
  expect(await npssoExpiry(npsso)).toBeNull()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = jest.fn(async () => Promise.reject(new Error('offline'))) as unknown as typeof fetch
  expect(await npssoExpiry(npsso)).toBeNull()
  ;(console.error as jest.Mock).mockRestore()
})
