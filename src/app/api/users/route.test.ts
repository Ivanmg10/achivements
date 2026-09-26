jest.mock('@/lib/db', () => {
  const query = jest.fn()
  return { __esModule: true, default: { query } }
})

jest.mock('@/lib/signupRateLimit', () => ({
  ...jest.requireActual('@/lib/signupRateLimit'),
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}))

import { POST } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { resetSignupLimit } from '@/lib/signupRateLimit'

const mockUser = { id: 1, username: 'ivan', email: null, theme: 'dark', avatar: null, admin: false }

beforeEach(() => {
  resetSignupLimit()
  delete process.env.REGISTRATION_OPEN
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  ;(pool.query as jest.Mock).mockImplementation((sql: string) => {
    if (sql.startsWith('SELECT')) return Promise.resolve({ rows: [] })
    return Promise.resolve({ rows: [mockUser] })
  })
})

afterEach(() => {
  delete process.env.REGISTRATION_OPEN
})

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/users', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

test('POST refuses when registration is closed', async () => {
  process.env.REGISTRATION_OPEN = 'false'
  const res = await POST(makeReq({ username: 'ivan', password: 'pass123' }))
  expect(res.status).toBe(403)
})

test('POST stops an address that keeps creating accounts', async () => {
  for (let i = 0; i < 5; i++) await POST(makeReq({ username: 'ivan' + i, password: 'pass123' }))
  const res = await POST(makeReq({ username: 'ivan9', password: 'pass123' }))
  expect(res.status).toBe(429)
})

test('POST creates user and returns 201', async () => {
  const res = await POST(makeReq({ username: 'ivan', password: 'pass123' }))
  expect(res.status).toBe(201)
})

test('POST returns 400 when username missing', async () => {
  const res = await POST(makeReq({ password: 'pass123' }))
  expect(res.status).toBe(400)
})

test('POST returns 400 when password missing', async () => {
  const res = await POST(makeReq({ username: 'ivan' }))
  expect(res.status).toBe(400)
})

test('POST returns 500 on db error', async () => {
  ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
  const res = await POST(makeReq({ username: 'ivan', password: 'pass123' }))
  expect(res.status).toBe(500)
})
