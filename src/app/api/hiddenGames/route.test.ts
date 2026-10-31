jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/scoreRefresh', () => ({ rebuildPeriods: jest.fn() }))
jest.mock('@/lib/rankings', () => ({ markRankingVisibilityChanged: jest.fn() }))

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { DELETE, GET, POST } from './route'
import { rebuildPeriods } from '@/lib/scoreRefresh'
import { markRankingVisibilityChanged } from '@/lib/rankings'

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
  expect((pool.query as jest.Mock).mock.calls.at(-1)![1]).toEqual(['7'])
})

test('POST stops at the cap, so one account cannot fill the table', async () => {
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ n: 5000 }] })
  const res = await POST(post({ source: 'steam', gameId: 620, title: 'Portal 2' }))
  expect(res.status).toBe(409)
})

test('POST hides a game, keeping its title and image', async () => {
  const res = await POST(post({ source: 'steam', gameId: 620, title: ' Portal 2 ', image: 'https://cdn/x.jpg' }))
  expect(status(res)).toBe(200)
  expect((pool.query as jest.Mock).mock.calls.at(-1)![1]).toEqual(['7', 'steam', 620, 'Portal 2', 'https://cdn/x.jpg'])
  expect(rebuildPeriods).toHaveBeenCalledWith(7)
  expect(markRankingVisibilityChanged).toHaveBeenCalled()
})

test('POST drops an image that is not https or a site path', async () => {
  await POST(post({ source: 'ra', gameId: 5, title: 'Zelda', image: 'javascript:alert(1)' }))
  expect((pool.query as jest.Mock).mock.calls.at(-1)![1][4]).toBeNull()
})

test('POST refuses a bad source, id or title', async () => {
  expect(status(await POST(post({ source: 'switch', gameId: 1, title: 'x' })))).toBe(400)
  expect(status(await POST(post({ source: 'ra', gameId: '1', title: 'x' })))).toBe(400)
  expect(status(await POST(post({ source: 'ra', gameId: 1, title: '' })))).toBe(400)
  expect(status(await POST(post({ source: 'ra', gameId: 1, title: 'x'.repeat(301) })))).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('DELETE shows a game again, only for this user', async () => {
  expect(status(await DELETE(del('source=ra&gameId=5')))).toBe(200)
  expect((pool.query as jest.Mock).mock.calls.at(-1)![1]).toEqual(['7', 'ra', 5])
  expect(rebuildPeriods).toHaveBeenCalledWith(7)
  expect(markRankingVisibilityChanged).toHaveBeenCalled()
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

describe('Xbox is admin-only', () => {
  test('a non-admin cannot hide an Xbox game, and nothing is written', async () => {
    expect(status(await POST(post({ source: 'xbox', gameId: 1738914043, title: 'Halo' })))).toBe(403)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('an admin can', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true } })
    expect(status(await POST(post({ source: 'xbox', gameId: 1738914043, title: 'Halo' })))).toBe(200)
    expect((pool.query as jest.Mock).mock.calls.at(-1)![1]).toEqual(['7', 'xbox', 1738914043, 'Halo', null])
  })
})
