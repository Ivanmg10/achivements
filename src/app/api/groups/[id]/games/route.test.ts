jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}))

import { POST, DELETE, PATCH } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

const params = { params: Promise.resolve({ id: '5' }) }

function makeRequest(method: string, body?: unknown, url = 'http://localhost/api/groups/5/games') {
  return new NextRequest(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/** The first query is always the ownership check. */
function ownsGroup(owns = true) {
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: owns ? [{ id: 5 }] : [] })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
})

describe('POST', () => {
  test('returns 401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { game_id: 1, title: 'x' }), params)
    expect(res.status).toBe(401)
  })

  test('returns 403 for someone else’s group', async () => {
    ownsGroup(false)
    const res = await POST(makeRequest('POST', { game_id: 1, title: 'x' }), params)
    expect(res.status).toBe(403)
  })

  test('stores a Steam game under its platform', async () => {
    ownsGroup()
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ next: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, source: 'steam', game_id: 620 }] })

    const res = await POST(makeRequest('POST', { source: 'steam', game_id: 620, title: 'Portal 2' }), params)

    expect(res.status).toBe(201)
    const [sql, values] = (pool.query as jest.Mock).mock.calls[2]
    expect(sql).toContain('ON CONFLICT (group_id, source, game_id)')
    expect(values.slice(0, 4)).toEqual([5, 'steam', 620, 'Portal 2'])
    expect(values[11]).toBe(3)
  })

  test('a request without a source adds an RA game', async () => {
    ownsGroup()
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ next: 0 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
    await POST(makeRequest('POST', { game_id: 620, title: 'Zelda' }), params)
    expect((pool.query as jest.Mock).mock.calls[2][1][1]).toBe('ra')
  })

  test('rejects an unknown source', async () => {
    ownsGroup()
    const res = await POST(makeRequest('POST', { source: 'xbox', game_id: 1, title: 'x' }), params)
    expect(res.status).toBe(400)
  })

  test('returns 400 for missing data', async () => {
    ownsGroup()
    const res = await POST(makeRequest('POST', { source: 'steam' }), params)
    expect(res.status).toBe(400)
  })

  test('returns 409 when the game is already in the group', async () => {
    ownsGroup()
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ next: 0 }] }).mockResolvedValueOnce({ rows: [] })
    const res = await POST(makeRequest('POST', { source: 'steam', game_id: 620, title: 'Portal 2' }), params)
    expect(res.status).toBe(409)
  })

  test('returns 500 on a database error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await POST(makeRequest('POST', { game_id: 1, title: 'x' }), params)
    expect(res.status).toBe(500)
  })
})

describe('DELETE', () => {
  test('removes only the game of the given platform', async () => {
    ownsGroup()
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    const res = await DELETE(
      makeRequest('DELETE', undefined, 'http://localhost/api/groups/5/games?gameId=620&source=steam'),
      params,
    )
    expect(res.status).toBe(200)
    const [sql, values] = (pool.query as jest.Mock).mock.calls[1]
    expect(sql).toContain('source = $2')
    expect(values).toEqual([5, 'steam', '620'])
  })

  test('without a source it removes the RA game', async () => {
    ownsGroup()
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    await DELETE(makeRequest('DELETE', undefined, 'http://localhost/api/groups/5/games?gameId=620'), params)
    expect((pool.query as jest.Mock).mock.calls[1][1]).toEqual([5, 'ra', '620'])
  })

  test('returns 400 without a gameId or with a bad source', async () => {
    ownsGroup()
    expect((await DELETE(makeRequest('DELETE'), params)).status).toBe(400)
    ownsGroup()
    const bad = makeRequest('DELETE', undefined, 'http://localhost/api/groups/5/games?gameId=1&source=xbox')
    expect((await DELETE(bad, params)).status).toBe(400)
  })
})

describe('PATCH', () => {
  test('updates counts per platform, RA when no source is given', async () => {
    ownsGroup()
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    const res = await PATCH(
      makeRequest('PATCH', [
        { game_id: 1, num_awarded: 1, max_possible: 2, points_won: 3, max_points: 4 },
        { source: 'steam', game_id: 620, num_awarded: 5, max_possible: 6, points_won: 0, max_points: 0 },
      ]),
      params,
    )
    expect(res.status).toBe(200)
    const calls = (pool.query as jest.Mock).mock.calls.slice(1)
    expect(calls[0][1]).toEqual([1, 2, 3, 4, 5, 'ra', 1])
    expect(calls[1][1]).toEqual([5, 6, 0, 0, 5, 'steam', 620])
  })
})
