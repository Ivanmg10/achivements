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

import { GET, PUT } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

const mockSession = { user: { id: '1' } }

function makePutRequest(body: unknown) {
  return new NextRequest('http://localhost/api/perfectGamesOrder', {
    method: 'PUT',
    body: JSON.stringify(body),
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

  test('returns saved order rows', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ game_id: 1, position: 0 }] })
    const res = await GET()
    expect(res.data).toEqual([{ game_id: 1, position: 0 }])
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('perfect_games_order'), ['1'])
  })

  test('returns 500 when the query fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('PUT', () => {
  test('returns 401 when no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await PUT(makePutRequest({ order: [1, 2] }))
    expect(res.status).toBe(401)
  })

  test('returns 400 when order is missing', async () => {
    const res = await PUT(makePutRequest({}))
    expect(res.status).toBe(400)
  })

  test('returns 400 when order is not an array', async () => {
    const res = await PUT(makePutRequest({ order: 'nope' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when an entry names no game', async () => {
    expect((await PUT(makePutRequest({ order: [1, 'two'] }))).status).toBe(400)
    expect((await PUT(makePutRequest({ order: ['switch:5'] }))).status).toBe(400)
  })

  test('upserts each game with its platform and its index as position', async () => {
    const res = await PUT(makePutRequest({ order: ['ra:10', 'steam:20', 30] }))
    expect(res.data).toEqual({ ok: true })
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), ['1', 'ra', 10, 0])
    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), ['1', 'steam', 20, 1])
    // A bare number is an RA id, as the order was stored before Steam joined.
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
    const res = await PUT(makePutRequest({ order: ['ra:10'] }))
    expect(res.status).toBe(500)
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    expect(mockClient.release).toHaveBeenCalled()
  })
})
