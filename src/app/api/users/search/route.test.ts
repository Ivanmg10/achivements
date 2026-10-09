jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({ allowAttempt: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { allowAttempt } from '@/lib/attemptLimit'

const get = (query: string) => new NextRequest(`http://localhost/api/users/search?${query}`)

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '1' })
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ username: 'ivan_mg', avatar: null, ra: true, steam: false, psn: false }] })
})

test('signed-out visitors get the auth answer and nothing is read', async () => {
  const denied = NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(get('q=ivan'))).toBe(denied)
  expect(pool.query).not.toHaveBeenCalled()
})

test('a query under three characters is a 400', async () => {
  expect((await GET(get('q=iv'))).status).toBe(400)
  expect((await GET(get('q=%20iv%20'))).status).toBe(400)
  expect((await GET(get(''))).status).toBe(400)
})

test('returns matching users, searching by prefix with the exact name as the tiebreak', async () => {
  const res = await GET(get('q=ivan'))
  expect(res.status).toBe(200)
  const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
  expect(sql).toContain("ILIKE $1 || '%'")
  // Private profiles are left out, unless it is the searcher's own.
  expect(sql).toContain('profile_public OR id = $3')
  expect(params).toEqual(['ivan', 'ivan', '1'])
})

test('LIKE wildcards in the query are escaped, so "_" does not match any letter', async () => {
  await GET(get('q=a_b%25'))
  expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['a\\_b\\%', 'a_b%', '1'])
})

test('a failing query is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await GET(get('q=ivan'))).status).toBe(500)
})

test('searching too often is a 429, and the table is not touched', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(false)
  expect((await GET(get('q=ivan'))).status).toBe(429)
  expect(allowAttempt).toHaveBeenCalledWith('user-search', 'user:1')
  expect(pool.query).not.toHaveBeenCalled()
})
