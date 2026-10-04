jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({ allowAttempt: jest.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { forgetUser } from '@/lib/userRecord'
import { allowAttempt } from '@/lib/attemptLimit'

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]

/** A Request-like object carrying one form field, as the route reads it. */
function upload(file: { bytes: number[]; size?: number } | string | null, contentLength?: number) {
  const entry =
    file === null || typeof file === 'string'
      ? file
      : { size: file.size ?? file.bytes.length, arrayBuffer: () => Promise.resolve(new Uint8Array(file.bytes).buffer) }
  return {
    headers: new Map(contentLength ? [['content-length', String(contentLength)]] : []),
    formData: () => Promise.resolve({ get: () => entry }),
  } as unknown as Request
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

const data = (res: unknown) => (res as { data: Record<string, unknown> }).data

test('stores a real image and points the account at it, in one statement', async () => {
  const res = await POST(upload({ bytes: PNG }))
  expect(res.status).toBe(200)
  const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
  expect(sql).toContain('INSERT INTO user_avatars')
  expect(sql).toContain('UPDATE users SET avatar')
  expect(params[0]).toBe('7')
  expect(params[2]).toBe('image/png')
  expect(params[3]).toMatch(/^\/api\/avatar\/7-\d+$/)
  expect(data(res).avatar).toBe(params[3])
  expect(forgetUser).toHaveBeenCalledWith('7')
})

test('signed out, nothing is stored', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await POST(upload({ bytes: PNG }))).status).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

test('a file that is not a PNG, JPEG or WebP is refused, whatever it claims', async () => {
  const svg = Array.from('<svg onload="alert(1)"/>', (c) => c.charCodeAt(0))
  const res = await POST(upload({ bytes: svg }))
  expect(res.status).toBe(415)
  expect(data(res).error).toBe('not-an-image')
  expect(pool.query).not.toHaveBeenCalled()
})

test('too large is refused, by the declared length before reading and by the real size after', async () => {
  expect((await POST(upload({ bytes: PNG }, 10 * 1024 * 1024))).status).toBe(413)
  expect((await POST(upload({ bytes: PNG, size: 600 * 1024 }))).status).toBe(413)
  expect((await POST(upload({ bytes: [], size: 0 }))).status).toBe(413)
  expect(pool.query).not.toHaveBeenCalled()
})

test('no file, or a text field instead of one, is a bad request', async () => {
  expect((await POST(upload(null))).status).toBe(400)
  expect((await POST(upload('not a file'))).status).toBe(400)
})

test('too many uploads are refused before anything is read', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(false)
  const res = await POST(upload({ bytes: PNG }))
  expect(res.status).toBe(429)
  expect(allowAttempt).toHaveBeenCalledWith('avatar', 'user:7')
  expect(pool.query).not.toHaveBeenCalled()
})

test('a database failure is a 500, not a crash', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await POST(upload({ bytes: PNG }))).status).toBe(500)
})
