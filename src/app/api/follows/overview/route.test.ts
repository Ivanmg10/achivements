jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { GET } from './route'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { getServerSession } from 'next-auth'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
})

test('the people you follow with their favourites, latest pins and public groups, from our data only', async () => {
  query.mockResolvedValue({ rows: [{ username: 'ivan' }] })
  const res = await GET()
  expect(res.data).toEqual([{ username: 'ivan' }])
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('u.profile_public')
  expect(sql).toContain('pinned_achievements')
  expect(sql).toContain('LIMIT 3')
  expect(sql).toContain('g.is_public')
  expect(sql).not.toMatch(/\bemail\b|password|raid\b/)
  expect(params).toEqual(['3', false])
})

test('signed out, nothing; a failure is a 500', async () => {
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: false, response: { status: 401 } })
  expect((await GET()).status).toBe(401)
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  query.mockRejectedValue(new Error('db down'))
  expect((await GET()).status).toBe(500)
})

test('Xbox — the account, the favourite and the pins — is for an admin viewer only', async () => {
  query.mockResolvedValue({ rows: [] })
  await GET()
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('u.xboxxuid IS NOT NULL AND $2::boolean')
  expect(sql).toContain("'xbox', CASE WHEN $2::boolean THEN u.favorite_xbox_game END")
  expect(sql).toContain("$2::boolean OR source <> 'xbox'")
  expect(params).toEqual(['3', false])
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '3', admin: true } })
  await GET()
  expect(query.mock.calls[1][1]).toEqual(['3', true])
})
