jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { DELETE, GET, PUT } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

const params = (id = '5') => ({ params: Promise.resolve({ id }) })
const request = (method: string, body?: unknown) =>
  new NextRequest('http://localhost/api/groups/5', { method, body: body !== undefined ? JSON.stringify(body) : undefined })

const group = (overrides = {}) => ({ id: 5, title: 'RPGs', is_public: false, user_id: 1, owner_public: true, ...overrides })

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
})

describe('GET', () => {
  test('the owner sees a private group with its games', async () => {
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [group()] })
      .mockResolvedValueOnce({ rows: [{ id: 9, game_id: 1 }] })
    const res = await GET(request('GET'), params())
    expect(res.status).toBe(200)
    expect((res as unknown as { data: { items: unknown[] } }).data.items).toHaveLength(1)
  })

  test('someone else cannot see a private group', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2' } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [group()] })
    const res = await GET(request('GET'), params())
    expect(res.status).toBe(401)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  test('nor can a visitor without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [group()] })
    expect((await GET(request('GET'), params())).status).toBe(401)
  })

  test('a public group is refused to a visitor without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [group({ is_public: true })] })
    expect((await GET(request('GET'), params())).status).toBe(401)
  })

  test('a public group of a private profile is only its owner\'s', async () => {
    const hidden = group({ is_public: true, owner_public: false })
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2' } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [hidden] })
    expect((await GET(request('GET'), params())).status).toBe(401)
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [hidden] }).mockResolvedValueOnce({ rows: [] })
    expect((await GET(request('GET'), params())).status).toBe(200)
  })

  test('a public group is open to other users, without saying who owns it', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2' } })
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [group({ is_public: true })] })
      .mockResolvedValueOnce({ rows: [] })
    expect((await GET(request('GET'), params())).status).toBe(200)
  })

  test('404 for a group that does not exist, or an id that is not a number', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    expect((await GET(request('GET'), params())).status).toBe(404)
    expect((await GET(request('GET'), params('abc'))).status).toBe(404)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  test('500 when the database fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    expect((await GET(request('GET'), params())).status).toBe(500)
  })
})

describe('PUT', () => {
  test('the owner can rename a group', async () => {
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })
      .mockResolvedValueOnce({ rows: [group({ title: 'New' })] })
    const res = await PUT(request('PUT', { title: ' New ', is_public: true }), params())
    expect(res.status).toBe(200)
    expect((pool.query as jest.Mock).mock.calls[1][1]).toEqual(['New', null, null, true, 5])
  })

  test('someone else cannot change it', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    expect((await PUT(request('PUT', { title: 'x' }), params())).status).toBe(403)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  test('invalid fields are refused before anything is written', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 5 }] })
    expect((await PUT(request('PUT', { title: 'a'.repeat(61) }), params())).status).toBe(400)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  test('401 without a session; 403 for an id that is not a number', async () => {
    expect((await PUT(request('PUT', { title: 'x' }), params('abc'))).status).toBe(403)
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await PUT(request('PUT', { title: 'x' }), params())).status).toBe(401)
    expect(pool.query).not.toHaveBeenCalled()
  })
})

describe('DELETE', () => {
  test('the owner can delete a group', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 5 }] }).mockResolvedValueOnce({ rows: [] })
    expect((await DELETE(request('DELETE'), params())).status).toBe(200)
    expect((pool.query as jest.Mock).mock.calls[1]).toEqual(['DELETE FROM game_groups WHERE id = $1', [5]])
  })

  test('someone else cannot', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
    expect((await DELETE(request('DELETE'), params())).status).toBe(403)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  test('500 when the database fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db down'))
    expect((await DELETE(request('DELETE'), params())).status).toBe(500)
  })
})

describe('Xbox is admin-only', () => {
  test('a visitor gets the group without its Xbox games', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2' } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [group({ is_public: true })] }).mockResolvedValueOnce({ rows: [] })
    await GET(request('GET'), params())
    const [sql, values] = (pool.query as jest.Mock).mock.calls[1]
    expect(sql).toContain("source <> 'xbox'")
    expect(values).toEqual([5, false])
  })

  test('an admin gets them', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2', admin: true } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [group({ is_public: true })] }).mockResolvedValueOnce({ rows: [] })
    await GET(request('GET'), params())
    expect((pool.query as jest.Mock).mock.calls[1][1]).toEqual([5, true])
  })

  test('another user who is not an admin gets them left out too', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2' } })
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [group({ is_public: true })] }).mockResolvedValueOnce({ rows: [] })
    await GET(request('GET'), params())
    expect((pool.query as jest.Mock).mock.calls[1][1]).toEqual([5, false])
  })
})
