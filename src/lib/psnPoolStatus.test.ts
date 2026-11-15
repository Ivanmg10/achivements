/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/preDb', () => ({ preDatabase: jest.fn() }))
jest.mock('@/lib/psnAccounts', () => ({ ...jest.requireActual('@/lib/psnAccounts'), listPsnAccounts: jest.fn() }))

import pool from '@/lib/db'
import { preDatabase } from '@/lib/preDb'
import { listPsnAccounts } from '@/lib/psnAccounts'
import { opsView, prePoolStatus, psnPoolEnv, psnPoolStatus } from './psnPoolStatus'
import { NOW, psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

const PRE_URL = 'postgres://pre'

beforeEach(() => {
  jest.clearAllMocks()
  ;(listPsnAccounts as jest.Mock).mockResolvedValue([psnAccount()])
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ failed: 1, total: 3 }] })
})

test('the status is the accounts and their summary, sync outcomes included', async () => {
  const status = await psnPoolStatus(NOW)
  expect(status.accounts).toHaveLength(1)
  expect(status.pool).toMatchObject({ accounts: 1, usable: 1, syncFailed: 1, syncTotal: 3 })
})

test('which environment: production PRO, preview PRE, a local machine none', () => {
  expect(psnPoolEnv({ VERCEL_ENV: 'production' })).toBe('PRO')
  expect(psnPoolEnv({ VERCEL_ENV: 'preview' })).toBe('PRE')
  expect(psnPoolEnv({})).toBeNull()
})

describe("pre's pool, read from production", () => {
  const client = { query: jest.fn(), release: jest.fn() }
  beforeEach(() => {
    client.query.mockReset().mockResolvedValue({ rows: [{ failed: 0, total: 0 }] })
    ;(preDatabase as jest.Mock).mockResolvedValue({ connect: async () => client })
  })

  test('only on production, with its own URL set there', async () => {
    expect(await prePoolStatus(NOW, { VERCEL_ENV: 'preview', PREVIEW_DATABASE_URL: PRE_URL })).toBeNull()
    expect(await prePoolStatus(NOW, { VERCEL_ENV: 'production' })).toBeNull()
    expect(await prePoolStatus(NOW, { VERCEL_ENV: 'production', PREVIEW_DATABASE_URL: PRE_URL, DATABASE_URL: PRE_URL })).toBeNull()
    expect(preDatabase).not.toHaveBeenCalled()
  })

  test('read inside a READ ONLY transaction: production never writes to pre', async () => {
    const status = await prePoolStatus(NOW, { VERCEL_ENV: 'production', PREVIEW_DATABASE_URL: PRE_URL, DATABASE_URL: 'postgres://pro' })
    expect(status?.pool.accounts).toBe(1)
    expect(preDatabase).toHaveBeenCalledWith(PRE_URL)
    expect(client.query.mock.calls[0][0]).toBe('BEGIN TRANSACTION READ ONLY')
    expect(listPsnAccounts).toHaveBeenCalledWith(client)
    expect(client.query.mock.calls.at(-1)![0]).toBe('COMMIT')
    expect(client.release).toHaveBeenCalled()
  })

  test('a failure rolls back and is thrown', async () => {
    ;(listPsnAccounts as jest.Mock).mockRejectedValueOnce(new Error('pre down'))
    await expect(prePoolStatus(NOW, { VERCEL_ENV: 'production', PREVIEW_DATABASE_URL: PRE_URL })).rejects.toThrow('pre down')
    expect(client.query.mock.calls.at(-1)![0]).toBe('ROLLBACK')
  })
})

test("the owner's agent reads labels, states and numbers: never the hint or the online ID", () => {
  const view = opsView(psnStatus([psnAccount({ hint: 'the blue one', onlineId: 'ServiceOne', cooldownUntil: NOW + 60_000 })]), NOW)
  const text = JSON.stringify(view)
  expect(text).not.toContain('blue')
  expect(text).not.toContain('ServiceOne')
  expect(view.accounts[0]).toMatchObject({ label: 'PSN-1', status: 'active', npssoDaysLeft: 40, coolingUntil: new Date(NOW + 60_000).toISOString(), canary: { ok: true } })
  expect(view.pool).toMatchObject({ accounts: 1, cooling: 1 })
})
