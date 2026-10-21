jest.mock('@/lib/steamLogin', () => ({
  ...jest.requireActual('@/lib/steamLogin'),
  verifySteamLogin: jest.fn(),
}))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/steamClient', () => ({ getPlayerSummaries: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ onPlatformLinked: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { GET } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { getPlayerSummaries } from '@/lib/steamClient'
import { onPlatformLinked } from '@/lib/scoreRefresh'
import { readTicket, ticketFromCookieHeader, verifySteamLogin } from '@/lib/steamLogin'

const verify = verifySteamLogin as jest.Mock
const query = pool.query as jest.Mock
const ID = '76561197960287930'
const BASE = 'https://www.cheevovault.com'

/** Steam's answer, coming back with what the start route put on return_to, in a browser holding `cookie`. */
function callback(back: Record<string, string>, cookie: string | null = `steam-state=${back.state}`) {
  const returnTo = `${BASE}/api/auth/steam/callback?${new URLSearchParams(back)}`
  const url = `${returnTo}&${new URLSearchParams({ 'openid.mode': 'id_res', 'openid.return_to': returnTo })}`
  return new NextRequest(url, { headers: cookie ? { cookie } : {} })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = BASE
  process.env.STEAM_API_KEY = 'key'
  verify.mockResolvedValue(ID)
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '7' })
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [{ personaname: 'Gabe' }] } })
  query.mockResolvedValue({ rows: [] })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

describe('signing in', () => {
  const back = { intent: 'signin', state: 's1' }

  test('a confirmed Steam account leaves a ticket cookie and goes on to the auth page', async () => {
    const res = await GET(callback(back))

    expect(res.headers.get('location')).toBe(`${BASE}/authPage?steam=1`)
    const cookie = res.headers.get('Set-Cookie') as string
    expect(readTicket(ticketFromCookieHeader(cookie.split(';')[0]))).toBe(ID)
    expect(cookie).toContain('Path=/api/auth; HttpOnly; SameSite=Lax')
    expect(cookie).toContain('Secure')
  })

  test('an answer Steam does not confirm sets no cookie', async () => {
    verify.mockResolvedValue(null)
    const res = await GET(callback(back))
    expect(res.headers.get('location')).toBe(`${BASE}/authPage?steam=failed`)
    expect(res.headers.get('Set-Cookie')).toBeUndefined()
  })

  test('Steam not answering says so, rather than "failed"', async () => {
    verify.mockRejectedValue(new Error('timeout'))
    expect((await GET(callback(back))).headers.get('location')).toBe(`${BASE}/authPage?steam=unavailable`)
  })

  test.each([
    ['no state cookie (a link someone else made)', null],
    ['a different state', 'steam-state=other'],
  ])('%s does nothing', async (_name, cookie) => {
    const res = await GET(callback(back, cookie))
    expect(res.headers.get('location')).toBe(`${BASE}/authPage?steam=failed`)
    expect(res.headers.get('Set-Cookie')).toBeUndefined()
  })
})

describe('linking', () => {
  const back = { intent: 'link', next: '/user', state: 's2' }

  test('links the proven account to the signed-in user, and comes back saying so', async () => {
    const res = await GET(callback(back))

    expect(res.headers.get('location')).toBe(`${BASE}/user#steam-linked`)
    const update = query.mock.calls.find(([sql]) => sql.startsWith('UPDATE'))
    expect(update[1]).toEqual([ID, 'Gabe', '7'])
    expect(update[0]).toContain('steam_login_id = $1')
    expect(onPlatformLinked).toHaveBeenCalledWith(7, 'steam')
  })

  test('a Steam account another user proved is theirs is refused', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 9 }] })
    const res = await GET(callback(back))
    expect(res.headers.get('location')).toBe(`${BASE}/user#steam-taken`)
    expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE'))).toBe(false)
  })

  test('linking again the account you already proved is fine', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 7 }] })
    expect((await GET(callback(back))).headers.get('location')).toBe(`${BASE}/user#steam-linked`)
  })

  test('without the state, nothing is linked', async () => {
    const res = await GET(callback(back, null))
    expect(res.headers.get('location')).toBe(`${BASE}/user#steam-failed`)
    expect(query).not.toHaveBeenCalled()
  })

  test('a lost session goes to sign in', async () => {
    ;(requireSession as jest.Mock).mockResolvedValue({ ok: false })
    expect((await GET(callback(back))).headers.get('location')).toBe(`${BASE}/authPage`)
    expect(query).not.toHaveBeenCalled()
  })

  test('returns only to the pages a link starts from', async () => {
    const res = await GET(callback({ ...back, next: 'https://evil.example' }))
    expect(res.headers.get('location')).toBe(`${BASE}/user#steam-linked`)
  })

  test('a database failure says so', async () => {
    query.mockRejectedValue(new Error('down'))
    expect((await GET(callback(back))).headers.get('location')).toBe(`${BASE}/user#steam-failed`)
  })
})
