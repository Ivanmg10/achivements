jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}))

import { GET, POST, DELETE, PUT } from './route'
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
    // The user's order (migrations/037): never-placed pins first, newest first. Each row's id is what the order is saved by.
    expect(sql).toContain('ORDER BY position ASC NULLS FIRST, created_at DESC')
    expect(sql).toMatch(/SELECT id,/)
  })

  test("with ?user= it lists that public profile's pins", async () => {
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 9, username: 'bob', profilePublic: true }] })
      .mockResolvedValueOnce({ rows: [{ source: 'ra' }] })
    const res = await GET(makeRequest('GET', 'http://localhost/api/favorites?source=all&user=bob'))
    expect((pool.query as jest.Mock).mock.calls[1][1]).toEqual(['9'])
    expect(res.data).toEqual([{ source: 'ra' }])
  })

  test("a private profile's pins are not readable by name", async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 9, username: 'bob', profilePublic: false }] })
    const res = await GET(makeRequest('GET', 'http://localhost/api/favorites?source=all&user=bob'))
    expect(res.status).toBe(401)
    expect(pool.query).toHaveBeenCalledTimes(1)
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

  test('returns 400 without an integer psnTrophyId for PSN', async () => {
    const res = await POST(makeRequest('POST', 'http://localhost/api/favorites', { source: 'psn', psnTrophyId: 'x', gameId: 2018800 }))
    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('pins a PSN trophy', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/favorites', {
        source: 'psn', psnTrophyId: 4, achievement: { id: 4, name: 'Bot Master' }, gameId: 2018800, gameTitle: 'Astro Bot',
      }),
    )
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("'psn'")
    expect(params).toEqual(['1', 4, 2018800, 'Astro Bot', JSON.stringify({ id: 4, name: 'Bot Master' })])
  })

  // The pool is mocked, so a column list one longer than its VALUES (a real 500
  // from Postgres) went unseen once: each source's insert is checked for it here.
  test.each([
    ['ra', { achievement: { ID: 5 }, gameId: 1 }],
    ['steam', { source: 'steam', steamApiname: 'WIN', gameId: 620 }],
    ['psn', { source: 'psn', psnTrophyId: 4, gameId: 2018800 }],
    ['xbox', { source: 'xbox', xboxAchievementId: 'a1', gameId: 9 }],
  ])('%s: the insert names as many columns as it gives values', async (_, body) => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await POST(makeRequest('POST', 'http://localhost/api/favorites', body))
    expect(res.status).toBe(200)
    const sql: string = (pool.query as jest.Mock).mock.calls[0][0]
    const columns = /pinned_achievements\s*\(([^)]*)\)/.exec(sql)![1].split(',')
    const values = /VALUES\s*\(([^)]*)\)/.exec(sql)![1].split(',')
    expect(columns).toHaveLength(values.length)
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

  test('unpins a PSN trophy by id + gameId', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await DELETE(makeRequest('DELETE', 'http://localhost/api/favorites?psnTrophyId=4&gameId=2018800'))
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("source = 'psn'")
    expect(params).toEqual(['1', '2018800', '4'])
  })

  test('returns 500 when the delete fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await DELETE(makeRequest('DELETE', 'http://localhost/api/favorites?achievementId=5'))
    expect(res.status).toBe(500)
  })
})

describe('Xbox', () => {
  const url = 'http://localhost/api/favorites'
  const achievement = { id: '49', name: 'Award', iconUrl: 'https://x/i.png' }

  test('a non-admin cannot pin an Xbox achievement', async () => {
    const res = await POST(makeRequest('POST', url, { source: 'xbox', xboxAchievementId: '49', gameId: 1738914043, achievement }))
    expect(res.status).toBe(403)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('an admin pins one, by its own id', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await POST(makeRequest('POST', url, { source: 'xbox', xboxAchievementId: '49', gameId: 1738914043, gameTitle: 'Halo', achievement }))
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("'xbox'")
    expect(sql).toContain('xbox_achievement_id')
    expect(params).toEqual(['1', '49', 1738914043, 'Halo', JSON.stringify(achievement)])
  })

  test('an Xbox pin needs its id and an integer game', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true } })
    expect((await POST(makeRequest('POST', url, { source: 'xbox', gameId: 1 }))).status).toBe(400)
    expect((await POST(makeRequest('POST', url, { source: 'xbox', xboxAchievementId: 49, gameId: 1 }))).status).toBe(400)
    expect((await POST(makeRequest('POST', url, { source: 'xbox', xboxAchievementId: '49', gameId: 'x' }))).status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('unpins one by its id and game', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await DELETE(makeRequest('DELETE', `${url}?xboxAchievementId=49&gameId=1738914043`))
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain("source = 'xbox'")
    expect(params).toEqual(['1', '1738914043', '49'])
  })

  test('the pins list leaves Xbox ones out for a non-admin, and keeps them for an admin', async () => {
    const rows = [{ source: 'ra' }, { source: 'xbox' }]
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows })
    expect((await GET(makeRequest('GET', `${url}?source=all`))).data).toEqual([{ source: 'ra' }])
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows })
    expect((await GET(makeRequest('GET', `${url}?source=all`))).data).toEqual(rows)
  })

  test('the Xbox pins of a game are listed by source', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    await GET(makeRequest('GET', `${url}?source=xbox&gameId=1738914043`))
    expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['1', 'xbox', '1738914043'])
  })
})

describe('PUT (the order)', () => {
  test('returns 401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await PUT(makeRequest('PUT', 'http://localhost/api/favorites', { order: [1] }))
    expect(res.status).toBe(401)
  })

  test.each([[undefined], [[]], [['a']], [[1, 1]], [[0]], [[1.5]]])('refuses %j as an order', async (order) => {
    const res = await PUT(makeRequest('PUT', 'http://localhost/api/favorites', { order }))
    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test("saves each pin's place, only among the user's own rows", async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 3 })
    const res = await PUT(makeRequest('PUT', 'http://localhost/api/favorites', { order: [30, 10, 20] }))
    expect(res.status).toBe(200)
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain('WITH ORDINALITY')
    expect(sql).toContain('p.user_id = $1')
    expect(params).toEqual(['1', [30, 10, 20]])
  })

  test('returns 500 when the update fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await PUT(makeRequest('PUT', 'http://localhost/api/favorites', { order: [1] }))
    expect(res.status).toBe(500)
  })
})
