jest.mock('@/lib/raKey', () => ({ sealRaKey: (key: string) => ({ sealed: `sealed:${key}`, hash: `hash:${key}` }), raKeyHash: (key: string) => `hash:${key}` }))
jest.mock('@/lib/db', () => {
  const query = jest.fn()
  return { __esModule: true, default: { query } }
})

jest.mock('@/lib/attemptLimit', () => ({
  clientAddress: () => '1.2.3.4',
  allowAttempt: jest.fn(),
}))

jest.mock('@/lib/raProfile', () => ({ ...jest.requireActual('@/lib/raProfile'), fetchRaProfile: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ onPlatformLinked: jest.fn() }))

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}))

import { POST } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt } from '@/lib/attemptLimit'
import { fetchRaProfile } from '@/lib/raProfile'
import { onPlatformLinked } from '@/lib/scoreRefresh'

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

describe('two sign-ups racing past the checks', () => {
  const raceOn = (constraint: string) =>
    (pool.query as jest.Mock).mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT')) return Promise.resolve({ rows: [] })
      return Promise.reject(Object.assign(new Error('duplicate key'), { code: '23505', constraint }))
    })

  test('the address index answers 409 email-taken', async () => {
    raceOn('users_email_lower_key')
    const res = await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
    expect(res.status).toBe(409)
    expect((res as unknown as { data: unknown }).data).toEqual({ error: 'email-taken' })
  })

  test('the username index answers 409 too', async () => {
    raceOn('users_username_lower_key')
    const res = await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
    expect(res.status).toBe(409)
  })
})

describe('signing up with RetroAchievements', () => {
  const body = { username: 'ivan', password: 'pass1234', email: 'ivan@test.com', ra: { username: 'palmeramiami', apiKey: ' key ' } }
  const insert = () => (pool.query as jest.Mock).mock.calls.find(([sql]) => String(sql).startsWith('INSERT'))

  beforeEach(() => {
    // The file's own beforeEach sets implementations but keeps old calls; this block reads them.
    ;(pool.query as jest.Mock).mockClear()
    ;(onPlatformLinked as jest.Mock).mockClear()
    ;(fetchRaProfile as jest.Mock).mockClear()
    ;(fetchRaProfile as jest.Mock).mockResolvedValue({ ok: true, profile: { User: 'PalmeraMiami', TotalPoints: 10 } })
  })

  test('RA is asked again and the account is created linked, with RA\'s picture', async () => {
    const res = await POST(makeReq(body))
    expect(res.status).toBe(201)
    expect(fetchRaProfile).toHaveBeenCalledWith('palmeramiami', 'key')
    const [sql, params] = insert()
    expect(sql).toContain('rausername, raid, "raUser"')
    expect(params.slice(3)).toEqual([
      'https://media.retroachievements.org/UserPic/PalmeraMiami.png',
      'PalmeraMiami',
      'sealed:key',
      JSON.stringify({ User: 'PalmeraMiami', TotalPoints: 10 }),
      'hash:key',
    ])
    expect(onPlatformLinked).toHaveBeenCalledWith(1, 'ra')
  })

  test('without RA, nothing of it is stored and nothing is asked', async () => {
    await POST(makeReq({ username: 'ivan', password: 'pass1234', email: 'ivan@test.com' }))
    expect(fetchRaProfile).not.toHaveBeenCalled()
    expect(insert()[1].slice(3)).toEqual([null, null, null, null, null])
    expect(onPlatformLinked).not.toHaveBeenCalled()
  })

  test('RA refusing the key stops the sign-up', async () => {
    ;(fetchRaProfile as jest.Mock).mockResolvedValue({ ok: false, error: 'ra-invalid', status: 400 })
    const res = await POST(makeReq(body))
    expect(res.status).toBe(400)
    expect((res as unknown as { data: unknown }).data).toEqual({ error: 'ra-invalid' })
    expect(insert()).toBeUndefined()
  })

  test('a key another account already uses answers key-in-use', async () => {
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      sql.startsWith('SELECT')
        ? Promise.resolve({ rows: [] })
        : Promise.reject(Object.assign(new Error('dup'), { code: '23505', constraint: 'users_raId_key' })),
    )
    const res = await POST(makeReq(body))
    expect(res.status).toBe(409)
    expect((res as unknown as { data: unknown }).data).toEqual({ error: 'key-in-use' })
  })
})
