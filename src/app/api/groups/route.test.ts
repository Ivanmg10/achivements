jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}))

import { GET, POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

function makeRequest(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/groups', {
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
    const res = await GET()
    expect(res.status).toBe(401)
  })

  test('returns groups with a per-platform game count', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Mix', game_count: 5, steam_count: 2, total_awarded: 3, total_possible: 10 }],
    })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.data).toEqual([
      { id: 1, title: 'Mix', game_count: 5, steam_count: 2, total_awarded: 3, total_possible: 10 },
    ])
  })

  test('returns 500 when the query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST', () => {
  test('returns 401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { title: 'New' }))
    expect(res.status).toBe(401)
  })

  test('returns 400 without a title', async () => {
    const res = await POST(makeRequest('POST', { title: '  ' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 at the group limit', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '10' }] })
    const res = await POST(makeRequest('POST', { title: 'New' }))
    expect(res.status).toBe(400)
  })

  test('creates a group with zero counts', async () => {
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ next: 0 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 9, title: 'New', description: null, icon: null, is_public: false, position: 0 }],
      })
    const res = await POST(makeRequest('POST', { title: 'New' }))
    expect(res.status).toBe(201)
    expect(res.data).toMatchObject({ id: 9, game_count: 0, steam_count: 0 })
  })

  test('returns 500 when the insert fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    const res = await POST(makeRequest('POST', { title: 'New' }))
    expect(res.status).toBe(500)
  })
})
