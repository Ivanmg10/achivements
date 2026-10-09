jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { DELETE, GET, POST } from './route'

const post = (body: unknown) => new NextRequest('http://localhost/api/hiddenGames', { method: 'POST', body: JSON.stringify(body) })
const del = (qs: string) => new NextRequest(`http://localhost/api/hiddenGames?${qs}`, { method: 'DELETE' })
const status = (r: unknown) => (r as { status: number }).status

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

test('GET lists the user’s hidden games, newest first', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ source: 'ra', game_id: 5, title: 'Zelda', image: '/i.png' }] })
  const res = await GET()
  expect(status(res)).toBe(200)
  expect((res as unknown as { data: unknown[] }).data).toHaveLength(1)
  expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['7'])
})

test('POST hides a game, keeping its title and image', async () => {
  const res = await POST(post({ source: 'steam', gameId: 620, title: ' Portal 2 ', image: 'https://cdn/x.jpg' }))
  expect(status(res)).toBe(200)
  expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['7', 'steam', 620, 'Portal 2', 'https://cdn/x.jpg'])
})

test('POST drops an image that is not https or a site path', async () => {
  await POST(post({ source: 'ra', gameId: 5, title: 'Zelda', image: 'javascript:alert(1)' }))
  expect((pool.query as jest.Mock).mock.calls[0][1][4]).toBeNull()
})

test('POST refuses a bad source, id or title', async () => {
  expect(status(await POST(post({ source: 'xbox', gameId: 1, title: 'x' })))).toBe(400)
  expect(status(await POST(post({ source: 'ra', gameId: '1', title: 'x' })))).toBe(400)
  expect(status(await POST(post({ source: 'ra', gameId: 1, title: '' })))).toBe(400)
  expect(status(await POST(post({ source: 'ra', gameId: 1, title: 'x'.repeat(301) })))).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('DELETE shows a game again, only for this user', async () => {
  expect(status(await DELETE(del('source=ra&gameId=5')))).toBe(200)
  expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['7', 'ra', 5])
  expect(status(await DELETE(del('source=ra')))).toBe(400)
  expect(status(await DELETE(del('source=xx&gameId=5')))).toBe(400)
})

test('signed out, nothing is read or written', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect(status(await GET())).toBe(401)
  expect(status(await POST(post({ source: 'ra', gameId: 1, title: 'x' })))).toBe(401)
  expect(status(await DELETE(del('source=ra&gameId=1')))).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

test('a database failure is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('down'))
  expect(status(await GET())).toBe(500)
})
