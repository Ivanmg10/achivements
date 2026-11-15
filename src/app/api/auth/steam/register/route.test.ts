jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/attemptLimit', () => ({ clientAddress: () => '1.2.3.4', allowAttempt: jest.fn() }))
jest.mock('@/lib/steamClient', () => ({ getPlayerSummaries: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ onPlatformLinked: jest.fn() }))
jest.mock('@/lib/verificationEmail', () => ({ sendVerificationEmail: jest.fn() }))
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt } from '@/lib/attemptLimit'
import { getPlayerSummaries } from '@/lib/steamClient'
import { onPlatformLinked } from '@/lib/scoreRefresh'
import { signTicket } from '@/lib/steamLogin'

const query = pool.query as jest.Mock
const ID = '76561197960287930'
const PLAYER = { personaname: 'Gabe Newell', avatarfull: 'https://avatars.steamstatic.com/abc_full.jpg', communityvisibilitystate: 3 }

function request(method: 'GET' | 'POST', { ticket = signTicket(ID), body }: { ticket?: string | null; body?: object } = {}) {
  return new NextRequest('https://www.cheevovault.com/api/auth/steam/register', {
    method,
    headers: { 'Content-Type': 'application/json', ...(ticket ? { cookie: `steam-login=${ticket}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

/** Answers the route's queries in order: steam registered?, name/email taken?, insert. */
function db({ registered = false, taken = [] as { name: boolean }[] } = {}) {
  query.mockImplementation((sql: string) => {
    if (sql.includes('steam_login_id = $1')) return Promise.resolve({ rows: registered ? [{}] : [] })
    if (sql.startsWith('SELECT')) return Promise.resolve({ rows: taken })
    return Promise.resolve({ rows: [{ id: 9, username: 'gabe' }] })
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.STEAM_API_KEY = 'key'
  delete process.env.REGISTRATION_OPEN
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [PLAYER] } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('ending the ticket expires its cookie', async () => {
  const { DELETE } = jest.requireActual('./route')
  const res = DELETE(new NextRequest('https://www.cheevovault.com/api/auth/steam/register', { method: 'DELETE' }))
  expect(res.headers.get('Set-Cookie')).toContain('steam-login=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0')
})

describe('GET', () => {
  test('a new Steam account gets what the form starts from', async () => {
    db()
    const res = await GET(request('GET'))
    expect(res.status).toBe(200)
    expect(res.data).toEqual({ registered: false, persona: 'Gabe Newell', avatar: PLAYER.avatarfull, username: 'Gabe_Newell', isPublic: true })
  })

  test('a known Steam account is told to sign in', async () => {
    db({ registered: true })
    expect((await GET(request('GET'))).data).toEqual({ registered: true })
    expect(getPlayerSummaries).not.toHaveBeenCalled()
  })

  test('without a ticket, nothing', async () => {
    const res = await GET(request('GET', { ticket: null }))
    expect(res.status).toBe(401)
    expect(res.data).toEqual({ error: 'expired' })
  })

  test('Steam failing is a 502', async () => {
    db()
    ;(getPlayerSummaries as jest.Mock).mockRejectedValue(new Error('down'))
    expect((await GET(request('GET'))).status).toBe(502)
  })
})

describe('POST', () => {
  const body = { username: 'gabe', email: 'gabe@test.com' }

  test('creates the account with Steam linked, its picture, and the chosen name and email', async () => {
    db()
    const res = await POST(request('POST', { body }))
    expect(res.status).toBe(201)

    const insert = query.mock.calls.find(([sql]) => sql.startsWith('INSERT'))
    expect(insert[1]).toEqual(['gabe', 'hashed', 'gabe@test.com', PLAYER.avatarfull, ID, 'Gabe Newell'])
    expect(insert[0]).toContain('steam_login_id')
    expect(onPlatformLinked).toHaveBeenCalledWith(9, 'steam')
  })

  test('the Steam account comes from the ticket, never from the body', async () => {
    db()
    await POST(request('POST', { body: { ...body, steamid: '76561197960287931' } }))
    const insert = query.mock.calls.find(([sql]) => sql.startsWith('INSERT'))
    expect(insert[1][4]).toBe(ID)
  })

  test.each([
    ['no ticket', { ticket: null, body }, 401, 'expired'],
    ['a bad username', { body: { ...body, username: 'a b' } }, 400, 'invalid-username'],
    ['a bad email', { body: { ...body, email: 'nope' } }, 400, 'invalid-email'],
  ])('%s is refused', async (_name, opts, status, error) => {
    db()
    const res = await POST(request('POST', opts as never))
    expect(res.status).toBe(status)
    expect(res.data).toEqual({ error })
  })

  test('a Steam account that already has a user is a 409', async () => {
    db({ registered: true })
    const res = await POST(request('POST', { body }))
    expect(res.status).toBe(409)
    expect(res.data).toEqual({ error: 'steam-taken' })
  })

  test('a taken username or email says which', async () => {
    db({ taken: [{ name: true }] })
    expect((await POST(request('POST', { body }))).data).toEqual({ error: 'username-taken' })
    db({ taken: [{ name: false }] })
    expect((await POST(request('POST', { body }))).data).toEqual({ error: 'email-taken' })
  })

  test('closed sign-ups and the rate limit hold here too', async () => {
    db()
    process.env.REGISTRATION_OPEN = 'false'
    expect((await POST(request('POST', { body }))).status).toBe(403)
    delete process.env.REGISTRATION_OPEN
    ;(allowAttempt as jest.Mock).mockResolvedValue(false)
    expect((await POST(request('POST', { body }))).status).toBe(429)
  })

  test('a race stopped by the unique index is a 409, not a 500', async () => {
    db()
    query.mockImplementation((sql: string) =>
      sql.startsWith('INSERT')
        ? Promise.reject(Object.assign(new Error('dup'), { code: '23505', constraint: 'users_steam_login_id_key' }))
        : Promise.resolve({ rows: [] }),
    )
    const res = await POST(request('POST', { body }))
    expect(res.status).toBe(409)
    expect(res.data).toEqual({ error: 'steam-taken' })
  })
})
