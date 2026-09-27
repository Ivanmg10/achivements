jest.mock('@/lib/db', () => {
  const query = jest.fn()
  return { __esModule: true, default: { query } }
})

jest.mock('@/lib/attemptLimit', () => ({
  clientAddress: () => '1.2.3.4',
  allowAttempt: jest.fn(),
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}))

import { POST } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt } from '@/lib/attemptLimit'

const mockUser = { id: 1, username: 'ivan', email: null, theme: 'dark', avatar: null, admin: false }

beforeEach(() => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
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
  const res = await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
  expect(res.status).toBe(403)
})

test('POST stops an address the limiter has had enough of', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(false)
  const res = await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
  expect(res.status).toBe(429)
})

test('POST creates user and returns 201', async () => {
  const res = await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
  expect(res.status).toBe(201)
})

test('POST returns 400 when username missing', async () => {
  const res = await POST(makeReq({ password: 'pass1234' }))
  expect(res.status).toBe(400)
})

test('POST returns 400 when password missing', async () => {
  const res = await POST(makeReq({ username: 'ivan' }))
  expect(res.status).toBe(400)
})

test('POST returns 500 on db error', async () => {
  ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
  const res = await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
  expect(res.status).toBe(500)
})

test('POST refuses a missing or malformed email', async () => {
  expect((await POST(makeReq({ username: 'ivan', password: 'pass1234' }))).status).toBe(400)
  expect((await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'nope' }))).status).toBe(400)
})

test('POST refuses a password under eight characters', async () => {
  expect((await POST(makeReq({ username: 'ivan', password: '1234567', email: 'ivan@test.com' }))).status).toBe(400)
})

test('POST hashes with a work factor of 12', async () => {
  const bcrypt = jest.requireMock('bcrypt') as { hash: jest.Mock }
  await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
  expect(bcrypt.hash).toHaveBeenCalledWith('pass1234', 12)
})

test('POST refuses a username that only differs in case from a taken one', async () => {
  ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
    Promise.resolve({ rows: sql.includes('LOWER(username)') ? [{ id: 2 }] : [] }),
  )
  const res = await POST(makeReq({ username: 'IVAN', password: 'pass1234', email: 'ivan@test.com' }))
  expect(res.status).toBe(409)
})

test('POST refuses an email another account already has, whatever its case', async () => {
  ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
    Promise.resolve({ rows: sql.includes('LOWER(email)') ? [{ id: 2 }] : [] }),
  )
  const res = await POST(makeReq({ username: 'new', password: 'pass1234', email: 'IVAN@test.com' }))
  expect(res.status).toBe(409)
  expect(res.data).toEqual({ error: 'email-taken' })
})
