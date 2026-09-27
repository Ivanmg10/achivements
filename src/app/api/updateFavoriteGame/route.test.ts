jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { POST, DELETE } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

function post(body: unknown) {
  return new NextRequest('http://localhost/api/updateFavoriteGame', { method: 'POST', body: JSON.stringify(body) })
}

function del(source?: string) {
  const url = new URL('http://localhost/api/updateFavoriteGame')
  if (source) url.searchParams.set('source', source)
  return new NextRequest(url.toString(), { method: 'DELETE' })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '3' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

test('a Steam favourite goes in its own column', async () => {
  const res = await POST(post({ id: 620, title: 'Portal 2', imageIcon: 'i.jpg', source: 'steam' }))
  expect(res.status).toBe(200)
  const [sql, values] = (pool.query as jest.Mock).mock.calls[0]
  expect(sql).toContain('favorite_steam_game')
  expect(JSON.parse(values[0])).toEqual({ id: 620, title: 'Portal 2', imageIcon: 'i.jpg' })
  expect(values[1]).toBe('3')
})

test('no source means the RA favourite, as before', async () => {
  await POST(post({ id: 1, title: 'Zelda' }))
  expect((pool.query as jest.Mock).mock.calls[0][0]).toContain('favorite_game')
})

test('rejects an unknown platform and incomplete games', async () => {
  expect((await POST(post({ id: 1, title: 'Zelda', source: 'psn' }))).status).toBe(400)
  expect((await POST(post({ title: 'Zelda' }))).status).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('needs a session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await POST(post({ id: 1, title: 'Zelda' }))).status).toBe(401)
  expect((await DELETE(del())).status).toBe(401)
})

test('delete clears the column of the given platform', async () => {
  expect((await DELETE(del('steam'))).status).toBe(200)
  expect((pool.query as jest.Mock).mock.calls[0][0]).toContain('favorite_steam_game = NULL')

  await DELETE(del())
  expect((pool.query as jest.Mock).mock.calls[1][0]).toContain('favorite_game = NULL')
})

test('delete rejects an unknown platform', async () => {
  expect((await DELETE(del('psn'))).status).toBe(400)
})

test('a database error is a 500, not a crash', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await POST(post({ id: 1, title: 'Zelda' }))).status).toBe(500)
  expect((await DELETE(del())).status).toBe(500)
})
