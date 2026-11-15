jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ readCache: jest.fn(async () => 0), writeCache: jest.fn() }))

import pool from '@/lib/db'
import { loadVaultMe } from './vaultMe'

const query = pool.query as jest.Mock

test('every read of the user\'s own points leaves unverified PSN out (#176)', async () => {
  query.mockResolvedValue({ rows: [] })
  await loadVaultMe(7, false)
  const sqls = query.mock.calls.map(([sql]) => sql as string).filter((sql) => /score_(games|periods)/.test(sql))
  // The ranking read, the week and month, the provisional count, the weeks and the days.
  expect(sqls.length).toBeGreaterThanOrEqual(5)
  for (const sql of sqls) expect(sql).toMatch(/psn_verified_at IS NOT NULL/)
})
