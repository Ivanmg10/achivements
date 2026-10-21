jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { listGroups } from './groupList'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  query.mockResolvedValue({ rows: [{ id: 1 }] })
})

test("lists every group of the user's own", async () => {
  await expect(listGroups('5')).resolves.toEqual([{ id: 1 }])
  const [sql, params] = query.mock.calls[0]
  expect(sql).not.toContain('AND g.is_public')
  expect(params).toEqual(['5', true])
})

test("someone else's page gets only the public ones", async () => {
  await listGroups(5, { publicOnly: true })
  expect(query.mock.calls[0][0]).toContain('AND g.is_public')
})

test('counts Xbox games, and leaves them out for who may not see Xbox', async () => {
  await listGroups(5, { publicOnly: true, xbox: false })
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('xbox_count')
  expect(sql).toContain("i.source <> 'xbox'")
  expect(sql).toContain("source <> 'xbox'")
  expect(sql).toContain("n.source <> 'xbox'")
  expect(params).toEqual([5, false])
})
