jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({ allowAttempt: jest.fn() }))
jest.mock('@/lib/publicUser', () => ({ findPublicUser: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from './route'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { allowAttempt } from '@/lib/attemptLimit'
import { findPublicUser } from '@/lib/publicUser'

const query = pool.query as jest.Mock
const post = (body: unknown) => POST(new NextRequest('http://localhost/api/follows', { method: 'POST', body: JSON.stringify(body) }))
const del = (qs: string) => DELETE(new NextRequest(`http://localhost/api/follows${qs}`, { method: 'DELETE' }))

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '1' })
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  ;(findPublicUser as jest.Mock).mockResolvedValue({ id: 7, username: 'ivan', profilePublic: true })
  query.mockResolvedValue({ rows: [{ n: 0 }] })
})

test('signed out, nothing', async () => {
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: false, response: { status: 401 } })
  expect((await GET()).status).toBe(401)
  expect((await post({ username: 'ivan' })).status).toBe(401)
  expect((await del('?username=ivan')).status).toBe(401)
})

describe('GET', () => {
  test('the public profiles you follow, newest first, from our own data only', async () => {
    query.mockResolvedValue({ rows: [{ username: 'ivan' }] })
    const res = await GET()
    expect(res.data).toEqual([{ username: 'ivan' }])
    const [sql, params] = query.mock.calls[0]
    expect(sql).toContain('u.profile_public')
    expect(sql).toContain('ORDER BY f.created_at DESC')
    expect(sql).not.toMatch(/\bemail\b|password|raid/)
    expect(params).toEqual(['1'])
  })

  test('a failure is a 500', async () => {
    query.mockRejectedValue(new Error('db down'))
    expect((await GET()).status).toBe(500)
  })
})

describe('POST', () => {
  test('follows a public profile, and twice is fine', async () => {
    expect((await post({ username: 'ivan' })).status).toBe(200)
    expect(query.mock.calls[1][0]).toContain('ON CONFLICT DO NOTHING')
    expect(query.mock.calls[1][1]).toEqual(['1', 7])
    expect(allowAttempt).toHaveBeenCalledWith('follow', 'user:1')
  })

  test('needs a name', async () => {
    expect((await post({})).status).toBe(400)
    expect((await POST(new NextRequest('http://localhost/api/follows', { method: 'POST', body: 'nope' }))).status).toBe(400)
  })

  test('an unknown or private profile is the same 404', async () => {
    ;(findPublicUser as jest.Mock).mockResolvedValue(null)
    expect((await post({ username: 'x' })).status).toBe(404)
    ;(findPublicUser as jest.Mock).mockResolvedValue({ id: 7, profilePublic: false })
    expect((await post({ username: 'x' })).status).toBe(404)
  })

  test('not yourself', async () => {
    ;(findPublicUser as jest.Mock).mockResolvedValue({ id: 1, profilePublic: true })
    expect((await post({ username: 'me' })).status).toBe(400)
  })

  test('rate limited, and capped', async () => {
    ;(allowAttempt as jest.Mock).mockResolvedValue(false)
    expect((await post({ username: 'ivan' })).status).toBe(429)
    ;(allowAttempt as jest.Mock).mockResolvedValue(true)
    query.mockResolvedValue({ rows: [{ n: 500 }] })
    expect((await post({ username: 'ivan' })).status).toBe(409)
  })

  test('a failure is a 500', async () => {
    ;(findPublicUser as jest.Mock).mockRejectedValue(new Error('db down'))
    expect((await post({ username: 'ivan' })).status).toBe(500)
  })
})

describe('DELETE', () => {
  test('unfollows by name, as data in the query', async () => {
    expect((await del('?username=Ivan')).status).toBe(200)
    expect(query.mock.calls[0][1]).toEqual(['1', 'Ivan'])
  })

  test('needs a name; a failure is a 500', async () => {
    expect((await del('')).status).toBe(400)
    query.mockRejectedValue(new Error('db down'))
    expect((await del('?username=ivan')).status).toBe(500)
  })
})
