jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ rebuildPeriods: jest.fn() }))

import pool from '@/lib/db'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { rebuildPeriods } from '@/lib/scoreRefresh'
import { GET, POST } from './route'

const query = pool.query as jest.Mock
const admin = { id: '1', username: 'boss', pwv: 'x' }
const post = (body: unknown) =>
  POST({ json: async () => body } as Request) as unknown as Promise<{ status: number; data: unknown }>

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin })
})

test('the balance per platform and the flagged games', async () => {
  query.mockResolvedValueOnce({ rows: [{ source: 'ra', users: 2 }] }).mockResolvedValueOnce({ rows: [{ username: 'ana', flag: 'suspect' }] })
  const res = (await GET({} as Request)) as unknown as { data: unknown }
  expect(res.data).toEqual({ balance: [{ source: 'ra', users: 2 }], flagged: [{ username: 'ana', flag: 'suspect' }] })
  expect(query.mock.calls[0][0]).toContain('percentile_cont')
})

test('clearing a flagged game counts it, rebuilds the weeks and is logged', async () => {
  query.mockResolvedValue({ rows: [{ username: 'ana', title: 'Game' }] })
  const res = await post({ userId: 4, source: 'steam', gameId: 220, flag: 'cleared' })
  expect(res.status).toBe(200)
  expect(query.mock.calls[0][1]).toEqual([4, 'steam', 220, 'cleared'])
  expect(rebuildPeriods).toHaveBeenCalledWith(4)
  expect(logAdminAction).toHaveBeenCalledWith(admin, 'ranking-flag', { id: 4, username: 'ana' }, { source: 'steam', gameId: 220, title: 'Game', flag: 'cleared' })
})

test('a bad body is a 400, an unflagged game a 404', async () => {
  expect((await post({ userId: 4, source: 'steam', gameId: 220, flag: 'gone' })).status).toBe(400)
  expect((await post({ userId: '4', source: 'steam', gameId: 220, flag: 'cleared' })).status).toBe(400)
  query.mockResolvedValue({ rows: [] })
  expect((await post({ userId: 4, source: 'steam', gameId: 220, flag: 'cleared' })).status).toBe(404)
  expect(logAdminAction).not.toHaveBeenCalled()
})

test('without the unlocked panel, nothing', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: { status: 403 } })
  expect((await GET({} as Request)).status).toBe(403)
  expect((await post({})).status).toBe(403)
  expect(query).not.toHaveBeenCalled()
})
