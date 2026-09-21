jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
}

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}))

import { GET, POST, DELETE, PUT } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

const mockSession = { user: { id: '1' } }

function makeRequest(method: string, body?: unknown, url = 'http://localhost/api/pinnedGames') {
  return new NextRequest(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  ;(pool.connect as jest.Mock).mockResolvedValue(mockClient)
  mockClient.query.mockResolvedValue({ rows: [] })
})

describe('GET', () => {
  test('returns 401 when no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  test('returns pinned game rows ordered by position', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ game_id: 1, position: 0 }] })
    const res = await GET()
    expect(res.data).toEqual([{ game_id: 1, position: 0 }])
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('pinned_games'), ['1'])
  })

  test('returns 500 when the query fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST', () => {
  test('returns 401 when no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { gameId: 5 }))
    expect(res.status).toBe(401)
  })

  test('returns 400 when gameId is missing', async () => {
    const res = await POST(makeRequest('POST', {}))
    expect(res.status).toBe(400)
  })

  test('returns 400 when gameId is not a number', async () => {
    const res = await POST(makeRequest('POST', { gameId: 'nope' }))
    expect(res.status).toBe(400)
  })

  test('inserts the pinned game, as RA when no source is given (older clients)', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    const res = await POST(makeRequest('POST', { gameId: 5 }))
    expect(res.data).toEqual({ ok: true })
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT (user_id, source, game_id)'), ['1', 'ra', 5])
  })

  test('pins a Steam game', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    await POST(makeRequest('POST', { gameId: 730, source: 'steam' }))
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['1', 'steam', 730])
  })

  test('rejects an unknown source', async () => {
    const res = await POST(makeRequest('POST', { gameId: 5, source: 'epic' }))
    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('returns 500 when the query fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    const res = await POST(makeRequest('POST', { gameId: 5 }))
    expect(res.status).toBe(500)
  })
})

describe('DELETE', () => {
  test('returns 401 when no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await DELETE(makeRequest('DELETE', undefined, 'http://localhost/api/pinnedGames?gameId=5'))
    expect(res.status).toBe(401)
  })

  test('returns 400 when gameId is missing', async () => {
    const res = await DELETE(makeRequest('DELETE'))
    expect(res.status).toBe(400)
  })

  test('deletes the pinned game', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    const res = await DELETE(makeRequest('DELETE', undefined, 'http://localhost/api/pinnedGames?gameId=5'))
    expect(res.data).toEqual({ ok: true })
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM pinned_games'), ['1', 'ra', '5'])
  })

  test('unpins a Steam game without touching an RA game with the same id', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    await DELETE(makeRequest('DELETE', undefined, 'http://localhost/api/pinnedGames?gameId=730&source=steam'))
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('AND source = $2'), ['1', 'steam', '730'])
  })

  test('rejects an unknown source', async () => {
    const res = await DELETE(makeRequest('DELETE', undefined, 'http://localhost/api/pinnedGames?gameId=5&source=epic'))
    expect(res.status).toBe(400)
  })

  test('returns 500 when the query fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    const res = await DELETE(makeRequest('DELETE', undefined, 'http://localhost/api/pinnedGames?gameId=5'))
    expect(res.status).toBe(500)
  })
})

describe('PUT', () => {
  test('returns 401 when no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await PUT(makeRequest('PUT', { order: [1, 2] }))
    expect(res.status).toBe(401)
  })

  test('returns 400 when order is missing', async () => {
    const res = await PUT(makeRequest('PUT', {}))
    expect(res.status).toBe(400)
  })

  test('returns 400 when order is not an array', async () => {
    const res = await PUT(makeRequest('PUT', { order: 'nope' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when order contains non-numeric ids', async () => {
    const res = await PUT(makeRequest('PUT', { order: [1, 'two'] }))
    expect(res.status).toBe(400)
  })

  test('upserts each game id with its index as position, plain ids meaning RA (older clients)', async () => {
    const res = await PUT(makeRequest('PUT', { order: [10, 20, 30] }))
    expect(res.data).toEqual({ ok: true })
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), ['1', 'ra', 10, 0])
    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), ['1', 'ra', 20, 1])
    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), ['1', 'ra', 30, 2])
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    expect(mockClient.release).toHaveBeenCalled()
  })

  test('rolls back and returns 500 when a query fails mid-transaction', async () => {
    mockClient.query.mockImplementation((sql: string) => {
      if (sql === 'BEGIN') return Promise.resolve()
      if (sql.includes('ON CONFLICT')) return Promise.reject(new Error('fail'))
      return Promise.resolve()
    })
    const res = await PUT(makeRequest('PUT', { order: [10] }))
    expect(res.status).toBe(500)
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    expect(mockClient.release).toHaveBeenCalled()
  })
})

describe('mixed RA and Steam order', () => {
  test('stores each entry with its source', async () => {
    mockClient.query.mockResolvedValue({})
    ;(pool.connect as jest.Mock).mockResolvedValue(mockClient)
    const res = await PUT(makeRequest('PUT', { order: [{ source: 'steam', gameId: 730 }, { source: 'ra', gameId: 730 }] }))
    expect(res.data).toEqual({ ok: true })
    expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), ['1', 'steam', 730, 0])
    expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), ['1', 'ra', 730, 1])
  })

  test('rejects an entry with an unknown source or no id', async () => {
    expect((await PUT(makeRequest('PUT', { order: [{ source: 'epic', gameId: 1 }] }))).status).toBe(400)
    expect((await PUT(makeRequest('PUT', { order: [{ source: 'steam' }] }))).status).toBe(400)
  })

  test('GET returns the source with each pin', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ source: 'steam', game_id: 730, position: 0 }] })
    const res = await GET()
    expect(res.data).toEqual([{ source: 'steam', game_id: 730, position: 0 }])
    expect((pool.query as jest.Mock).mock.calls[0][0]).toContain('SELECT source, game_id, position')
  })
})
