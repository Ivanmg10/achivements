jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/rankings', () => ({ vaultTotalsOrNone: jest.fn(async () => new Map([[5, 900]])) }))

import { GET } from './route'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { getServerSession } from 'next-auth'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
})

test('the people you follow with their favourites, showcase and public groups, from our data only', async () => {
  query.mockResolvedValue({ rows: [{ id: 5, username: 'ivan' }, { id: 6, username: 'ana' }] })
  const res = await GET()
  // Their Vault Points ride along; their ids do not leave the server.
  expect(res.data).toEqual([{ username: 'ivan', vaultPoints: 900 }, { username: 'ana', vaultPoints: null }])
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('u.profile_public')
  // The showcase, never the pinned goals.
  expect(sql).toContain('FROM showcase_achievements sc')
  expect(sql).not.toContain('pinned_achievements')
  expect(sql).toContain('g.is_public')
  expect(sql).not.toMatch(/\bemail\b|password|raid\b/)
  expect(params).toEqual(['3', false])
})

test('?who=followers: the people who follow you, the same way, public profiles only', async () => {
  query.mockResolvedValue({ rows: [{ id: 5, username: 'fan' }] })
  const res = await GET({ url: 'http://x/api/follows/overview?who=followers' } as Request)
  expect(res.data).toEqual([{ username: 'fan', vaultPoints: 900 }])
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('JOIN users u ON u.id = f.follower_id')
  expect(sql).toContain('WHERE f.followed_id = $1 AND u.profile_public')
  expect(params).toEqual(['3', false])
  // Anything else is the people you follow.
  await GET({ url: 'http://x/api/follows/overview?who=all' } as Request)
  expect(query.mock.calls[1][0]).toContain('JOIN users u ON u.id = f.followed_id')
})

test('presence only for who shares it: online within 5 minutes, the time rounded to 5', async () => {
  query.mockResolvedValue({ rows: [] })
  await GET()
  const [sql] = query.mock.calls[0]
  expect(sql).toContain("COALESCE(u.show_presence AND u.last_seen_at > now() - interval '5 minutes', false) AS online")
  expect(sql).toContain('CASE WHEN u.show_presence THEN to_timestamp(floor(extract(epoch FROM u.last_seen_at) / 300) * 300) END')
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
  expect(sql).toContain("$2::boolean OR sc.source <> 'xbox'")
  expect(sql).toContain("'xbox', CASE WHEN $2::boolean THEN u.xboxgamertag END")
  expect(params).toEqual(['3', false])
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '3', admin: true } })
  await GET()
  expect(query.mock.calls[1][1]).toEqual(['3', true])
})
