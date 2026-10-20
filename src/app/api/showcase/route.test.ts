jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ dataOwner: jest.fn() }))

import { GET, POST, DELETE, PUT } from './route'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { dataOwner } from '@/lib/apiAuth'

const query = pool.query as jest.Mock
const req = (method: string, url: string, body?: unknown) =>
  new NextRequest(`http://localhost/api/showcase${url}`, { method, body: body !== undefined ? JSON.stringify(body) : undefined })

const ENTRY = {
  source: 'ra',
  gameId: 3,
  achievementKey: '42',
  gameTitle: 'Super Metroid',
  title: 'Sin daños',
  description: 'Derrota a Ridley sin daño.',
  badge: 'https://media.retroachievements.org/Badge/1.png',
  earnedAt: '2026-10-01T10:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1' })
})

describe('GET', () => {
  test('the owner’s showcase in its order; Xbox only for who may see it', async () => {
    query.mockResolvedValue({ rows: [{ id: 1, source: 'ra' }, { id: 2, source: 'xbox' }] })
    const res = await GET(req('GET', '?user=luna'))
    expect((res as unknown as { data: unknown }).data).toEqual([{ id: 1, source: 'ra' }])
    expect(query.mock.calls[0][0]).toContain('ORDER BY position ASC')
    expect(query.mock.calls[0][1]).toEqual(['1'])
  })

  test('no owner (signed out, private profile): 401', async () => {
    ;(dataOwner as jest.Mock).mockResolvedValue(null)
    expect((await GET(req('GET', ''))).status).toBe(401)
  })
})

describe('POST', () => {
  test('adds an earned achievement at the end, while there are fewer than five', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 9 }] })
    const res = await POST(req('POST', '', ENTRY))
    expect((res as unknown as { data: unknown }).data).toEqual({ id: 9 })
    const [sql, params] = query.mock.calls[0]
    expect(sql).toContain('HAVING COUNT(*) < 5')
    expect(sql).toContain('ON CONFLICT (user_id, source, game_id, achievement_key) DO NOTHING')
    expect(params).toEqual(['1', 'ra', 3, '42', 'Super Metroid', 'Sin daños', 'Derrota a Ridley sin daño.', ENTRY.badge, ENTRY.earnedAt])
  })

  test('already there: the existing one; full: 409', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 4 }] })
    expect((await POST(req('POST', '', ENTRY))).status).toBe(200)
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
    const res = await POST(req('POST', '', ENTRY))
    expect(res.status).toBe(409)
    expect((res as unknown as { data: { error: string } }).data.error).toBe('showcase-full')
  })

  test('not earned, or malformed: 400; Xbox for a non-admin: 403; signed out: 401', async () => {
    expect((await POST(req('POST', '', { ...ENTRY, earnedAt: null }))).status).toBe(400)
    expect((await POST(req('POST', '', { ...ENTRY, badge: 'http://x/a.png' }))).status).toBe(400)
    expect((await POST(req('POST', '', { ...ENTRY, source: 'xbox' }))).status).toBe(403)
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await POST(req('POST', '', ENTRY))).status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })
})

describe('DELETE and PUT', () => {
  test('delete only the user’s own row', async () => {
    query.mockResolvedValue({ rows: [] })
    expect((await DELETE(req('DELETE', '?id=7'))).status).toBe(200)
    expect(query.mock.calls[0][1]).toEqual([7, '1'])
    expect((await DELETE(req('DELETE', '?id=x'))).status).toBe(400)
  })

  test('reorder by ids; a bad order is a 400', async () => {
    query.mockResolvedValue({ rows: [] })
    expect((await PUT(req('PUT', '', { order: [3, 1, 2] }))).status).toBe(200)
    expect(query.mock.calls[0][1]).toEqual(['1', [3, 1, 2]])
    expect((await PUT(req('PUT', '', { order: [1, 1] }))).status).toBe(400)
    expect((await PUT(req('PUT', '', { order: [] }))).status).toBe(400)
  })

  test('a failing query is a 500', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    query.mockRejectedValue(new Error('db down'))
    expect((await DELETE(req('DELETE', '?id=7'))).status).toBe(500)
  })
})
