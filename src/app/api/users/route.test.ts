jest.mock('@/lib/db', () => {
  const query = jest.fn()
  return { __esModule: true, default: { query } }
})

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}))

import { POST } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'

const mockUser = { id: 1, username: 'ivan', email: null, theme: 'dark', avatar: null, admin: false }

beforeEach(() => {
  process.env.REGISTER_TOKEN = 'secret123'
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  ;(pool.query as jest.Mock).mockImplementation((sql: string) => {
    if (sql.startsWith('SELECT')) return Promise.resolve({ rows: [] })
    return Promise.resolve({ rows: [mockUser] })
  })
})

afterEach(() => {
  delete process.env.REGISTER_TOKEN
})

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/users', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

test('POST returns 403 when REGISTER_TOKEN not set', async () => {
  delete process.env.REGISTER_TOKEN
  const res = await POST(makeReq({ username: 'ivan', password: 'pass123', registerToken: 'x' }))
  expect(res.status).toBe(403)
})

test('POST returns 401 when token wrong', async () => {
  const res = await POST(makeReq({ username: 'ivan', password: 'pass', registerToken: 'wrong' }))
  expect(res.status).toBe(401)
})

test('POST creates user and returns 201', async () => {
  const res = await POST(makeReq({ username: 'ivan', password: 'pass123', registerToken: 'secret123' }))
  expect(res.status).toBe(201)
})

test('POST returns 400 when username missing', async () => {
  const res = await POST(makeReq({ password: 'pass123', registerToken: 'secret123' }))
  expect(res.status).toBe(400)
})

test('POST returns 400 when password missing', async () => {
  const res = await POST(makeReq({ username: 'ivan', registerToken: 'secret123' }))
  expect(res.status).toBe(400)
})

test('POST returns 500 on db error', async () => {
  ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
  const res = await POST(makeReq({ username: 'ivan', password: 'pass123', registerToken: 'secret123' }))
  expect(res.status).toBe(500)
})
