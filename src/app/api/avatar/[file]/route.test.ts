jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/userRecord', () => ({ loadUser: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { loadUser } from '@/lib/userRecord'

const get = (file: string) => GET({} as Request, { params: Promise.resolve({ file }) })
const IMAGE = Buffer.from([0x89, 0x50, 0x4e, 0x47])

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 7, admin: false })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ image: IMAGE, mime: 'image/png' }] })
})

test('the owner gets the picture, typed, unsniffable and cached for good', async () => {
  const res = await get('7-1700000000')
  expect(res.status).toBe(200)
  const headers = (res as unknown as { headers: Map<string, string> }).headers
  expect(headers.get('Content-Type')).toBe('image/png')
  expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
  expect(headers.get('Cache-Control')).toContain('immutable')
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM user_avatars'), [7])
})

test('someone else gets a 404, the same as for no picture', async () => {
  const res = await get('8-1700000000')
  expect(res.status).toBe(404)
  expect(pool.query).not.toHaveBeenCalled()
  expect(loadUser).toHaveBeenCalledWith('7', { fresh: true })
})

test('an admin can see anyone’s, checked fresh from the database', async () => {
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 7, admin: true })
  expect((await get('8-1700000000')).status).toBe(200)
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
