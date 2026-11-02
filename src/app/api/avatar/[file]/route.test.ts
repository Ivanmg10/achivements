jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'

const get = (file: string) => GET({} as Request, { params: Promise.resolve({ file }) })
const IMAGE = Buffer.from([0x89, 0x50, 0x4e, 0x47])

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ image: IMAGE, mime: 'image/png' }] })
})

test('the picture is typed, typed, unsniffable and cached for good', async () => {
  const res = await get('7-1700000000')
  expect(res.status).toBe(200)
  const headers = (res as unknown as { headers: Map<string, string> }).headers
  expect(headers.get('Content-Type')).toBe('image/png')
  expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
  expect(headers.get('Cache-Control')).toContain('immutable')
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM user_avatars'), expect.arrayContaining([7]))
})

test('any signed-in user can see someone else\'s: it is part of their public profile', async () => {
  const res = await get('8-1700000000')
  expect(res.status).toBe(200)
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM user_avatars'), expect.arrayContaining([8]))
})

test('the current picture is what is asked for, and a private profile stays private', async () => {
  await get('12-1700000000')
  const [sql, args] = (pool.query as jest.Mock).mock.calls[0]
  expect(sql).toContain('u.profile_public OR u.id = $3 OR $4::boolean')
  expect(args).toEqual([12, '/api/avatar/12-1700000000', '7', false])
})

test('signed out is refused', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await get('7-1')).status).toBe(401)
})

test('a path that is not id-version is a 404, without touching the database', async () => {
  expect((await get('../7-1')).status).toBe(404)
  expect((await get('7')).status).toBe(404)
  expect(pool.query).not.toHaveBeenCalled()
})

test('no stored picture is a 404', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  expect((await get('7-1')).status).toBe(404)
})
