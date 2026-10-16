jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { GET, PUT } from './route'

const put = (body: unknown) => new NextRequest('http://localhost/api/preferences', { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body) })
const status = (r: unknown) => (r as { status: number }).status
const data = (r: unknown) => (r as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ preferences: { 'library-layout': 'list' } }] })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

describe('GET', () => {
  test('401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect(status(await GET())).toBe(401)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('the account preferences, only the allowed ones', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ preferences: { 'library-layout': 'list', admin: 'yes' } }] })
    const res = await GET()
    expect(data(res)).toEqual({ preferences: { 'library-layout': 'list' } })
    expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['7'])
  })

  test('none yet is an empty object', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ preferences: {} }] })
    expect(data(await GET())).toEqual({ preferences: {} })
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    expect(data(await GET())).toEqual({ preferences: {} })
  })

  test('500 when the database fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    expect(status(await GET())).toBe(500)
  })
})

describe('PUT', () => {
  test('401 without a session, and nothing is written', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect(status(await PUT(put({ changes: { 'library-layout': 'list' } })))).toBe(401)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('saves what is set and forgets what is null, for this user only', async () => {
    const res = await PUT(put({ changes: { 'library-layout': 'cards', 'library-cols': null } }))
    expect(status(res)).toBe(200)
    expect(data(res)).toEqual({ preferences: { 'library-layout': 'list' } })
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain('UPDATE users SET preferences')
    expect(params).toEqual([JSON.stringify({ 'library-layout': 'cards' }), ['library-cols'], '7'])
  })

  test.each([
    ['a key off the list', { changes: { 'is-admin': 'true' } }],
    ['no changes', {}],
    ['a value that is not a string', { changes: { 'library-layout': { a: 1 } } }],
    ['not JSON at all', 'not json'],
  ])('400 for %s, and nothing is written', async (_name, body) => {
    expect(status(await PUT(put(body)))).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('401 when the account no longer exists', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    expect(status(await PUT(put({ changes: { 'library-layout': 'list' } })))).toBe(401)
  })

  test('500 when the database fails', async () => {
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    expect(status(await PUT(put({ changes: { 'library-layout': 'list' } })))).toBe(500)
  })
})
