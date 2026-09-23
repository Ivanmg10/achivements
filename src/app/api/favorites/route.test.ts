jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}))

import { GET, POST, DELETE } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

function makeRequest(method: string, url: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
})

describe('GET', () => {
  test('returns 401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await GET(makeRequest('GET', 'http://localhost/api/favorites'))
    expect(res.status).toBe(401)
  })

  test('defaults to RA when no source is given', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    await GET(makeRequest('GET', 'http://localhost/api/favorites'))
    const [, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(params).toEqual(['1', 'ra'])
  })

  test('filters by Steam source and gameId', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    await GET(makeRequest('GET', 'http://localhost/api/favorites?source=steam&gameId=620'))
    const [, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(params).toEqual(['1', 'steam', '620'])
  })

  test('returns every pin across both platforms with source=all', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ source: 'steam' }, { source: 'ra' }] })
    const res = await GET(makeRequest('GET', 'http://localhost/api/favorites?source=all'))
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(params).toEqual(['1'])
    expect(sql).not.toContain('source =')
    expect(res.data).toEqual([{ source: 'steam' }, { source: 'ra' }])
  })

  test('returns 500 when the query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await GET(makeRequest('GET', 'http://localhost/api/favorites'))
    expect(res.status).toBe(500)
  })
})

describe('POST', () => {
  test('returns 401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest('POST', 'http://localhost/api/favorites', { gameId: 1 }))
    expect(res.status).toBe(401)
  })

  test('returns 400 without an achievement for RA', async () => {
    const res = await POST(makeRequest('POST', 'http://localhost/api/favorites', { gameId: 1 }))
    expect(res.status).toBe(400)
  })

  test('pins an RA achievement', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/favorites', {
        achievement: { ID: 5, Title: 'x' },
        gameId: 1,
        gameTitle: 'Game',
        numDistinctPlayers: 10,
      }),
    )
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("'ra'")
    expect(params).toEqual(['1', 5, 1, 'Game', JSON.stringify({ ID: 5, Title: 'x' }), 10])
  })

  test('returns 400 without steamApiname for Steam', async () => {
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/favorites', { source: 'steam', gameId: 620 }),
    )
    expect(res.status).toBe(400)
  })

  test('pins a Steam achievement', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/favorites', {
        source: 'steam',
        steamApiname: 'ACH_WIN',
        achievement: { apiname: 'ACH_WIN', title: 'Win' },
        gameId: 620,
        gameTitle: 'Portal 2',
        numDistinctPlayers: 0,
      }),
    )
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("'steam'")
    expect(params).toEqual(['1', 'ACH_WIN', 620, 'Portal 2', JSON.stringify({ apiname: 'ACH_WIN', title: 'Win' }), 0])
  })

  test('returns 500 when the insert fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/favorites', { achievement: { ID: 5 }, gameId: 1 }),
    )
    expect(res.status).toBe(500)
  })
})

describe('DELETE', () => {
  test('returns 401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await DELETE(makeRequest('DELETE', 'http://localhost/api/favorites?achievementId=5'))
    expect(res.status).toBe(401)
  })

  test('returns 400 without any identity', async () => {
    const res = await DELETE(makeRequest('DELETE', 'http://localhost/api/favorites'))
    expect(res.status).toBe(400)
  })

  test('unpins an RA achievement by id', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await DELETE(makeRequest('DELETE', 'http://localhost/api/favorites?achievementId=5'))
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("source = 'ra'")
    expect(params).toEqual(['1', '5'])
  })

  test('unpins a Steam achievement by apiname + gameId', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await DELETE(
      makeRequest('DELETE', 'http://localhost/api/favorites?steamApiname=ACH_WIN&gameId=620'),
    )
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("source = 'steam'")
    expect(params).toEqual(['1', '620', 'ACH_WIN'])
  })

  test('returns 500 when the delete fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await DELETE(makeRequest('DELETE', 'http://localhost/api/favorites?achievementId=5'))
    expect(res.status).toBe(500)
  })
})
