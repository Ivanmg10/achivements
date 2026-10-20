jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))

import { GET } from './route'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
})

test('how many you follow and how many follow you, for your own account', async () => {
  query.mockResolvedValue({ rows: [{ following: 4, followers: 2 }] })
  const res = await GET()
  expect(res.data).toEqual({ following: 4, followers: 2 })
  const [sql, params] = query.mock.calls[0]
  // The same people the two lists show: public profiles, on both sides.
  expect(sql.match(/u\.profile_public/g)).toHaveLength(2)
  expect(sql).toContain('JOIN users u ON u.id = f.follower_id')
  expect(params).toEqual(['3'])
})

test('signed out, nothing; a failure is a 500', async () => {
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: false, response: { status: 401 } })
  expect((await GET()).status).toBe(401)
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  query.mockRejectedValue(new Error('db down'))
  expect((await GET()).status).toBe(500)
})
