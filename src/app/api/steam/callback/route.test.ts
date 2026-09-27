jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamOpenId', () => {
  const actual = jest.requireActual('@/lib/steamOpenId')
  return { ...actual, verifyAssertion: jest.fn() }
})
jest.mock('@/lib/steamClient', () => {
  const actual = jest.requireActual('@/lib/steamClient')
  return { ...actual, getPlayerSummaries: jest.fn() }
})

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { verifyAssertion, signState } from '@/lib/steamOpenId'
import { getPlayerSummaries } from '@/lib/steamClient'

const STEAM_ID = '76561198000000000'
const CLAIMED = `https://steamcommunity.com/openid/id/${STEAM_ID}`

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/steam/callback')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

/** A well-formed callback for user 7 — individual tests override one piece at a time. */
function validParams(overrides: Record<string, string> = {}) {
  return {
    'openid.mode': 'id_res',
    'openid.claimed_id': CLAIMED,
    state: signState('7'),
    ...overrides,
  }
}

function steamStatus(res: { headers: Map<string, string> }) {
  return new URL(res.headers.get('location') as string).searchParams.get('steam')
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(verifyAssertion as jest.Mock).mockResolvedValue(true)
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [{ personaname: 'Ivan' }] } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rowCount: 0, rows: [] })
})

test('returns 503 when NEXTAUTH_URL is not configured', async () => {
  delete process.env.NEXTAUTH_URL
  const res = await GET(makeRequest(validParams()))
  expect((res as { status: number }).status).toBe(503)
})

test('redirects with unauthorized when there is no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('unauthorized')
  expect(pool.query).not.toHaveBeenCalled()
})

test('handles the user cancelling at Steam', async () => {
  const res = await GET(makeRequest(validParams({ 'openid.mode': 'cancel' })))
  expect(steamStatus(res as never)).toBe('cancelled')
  expect(pool.query).not.toHaveBeenCalled()
})

test('rejects a missing state', async () => {
  const params = validParams()
  delete (params as Record<string, string>).state
  const res = await GET(makeRequest(params))
  expect(steamStatus(res as never)).toBe('invalid_state')
})

test('rejects a state minted for a different user', async () => {
  const res = await GET(makeRequest(validParams({ state: signState('99') })))
  expect(steamStatus(res as never)).toBe('invalid_state')
  expect(verifyAssertion).not.toHaveBeenCalled()
})

test('rejects an assertion Steam does not vouch for', async () => {
  ;(verifyAssertion as jest.Mock).mockResolvedValue(false)
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('invalid_assertion')
  expect(pool.query).not.toHaveBeenCalled()
})

test('rejects a claimed_id that is not a Steam identity URL', async () => {
  const res = await GET(
    makeRequest(validParams({ 'openid.claimed_id': `https://evil.example.com/openid/id/${STEAM_ID}` })),
  )
  expect(steamStatus(res as never)).toBe('invalid_identity')
  expect(pool.query).not.toHaveBeenCalled()
})

test('links the account and stores the persona name', async () => {
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('linked')
  expect(pool.query).toHaveBeenLastCalledWith(
    'UPDATE users SET steamid = $1, steamusername = $2 WHERE id = $3',
    [STEAM_ID, 'Ivan', '7'],
  )
})

test('refuses a Steam account already linked to another user', async () => {
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('already_linked')
  expect(pool.query).toHaveBeenCalledTimes(1)
})

test('still links when the persona lookup fails', async () => {
  ;(getPlayerSummaries as jest.Mock).mockRejectedValue(new Error('steam down'))
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('linked')
  expect(pool.query).toHaveBeenLastCalledWith(expect.any(String), [STEAM_ID, null, '7'])
})

test('still links when no Steam API key is configured', async () => {
  delete process.env.STEAM_API_KEY
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('linked')
  expect(getPlayerSummaries).not.toHaveBeenCalled()
  expect(pool.query).toHaveBeenLastCalledWith(expect.any(String), [STEAM_ID, null, '7'])
})

test('stores null when Steam returns no players', async () => {
  ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [] } })
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('linked')
  expect(pool.query).toHaveBeenLastCalledWith(expect.any(String), [STEAM_ID, null, '7'])
})

test('redirects with an error when the DB write fails', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  const res = await GET(makeRequest(validParams()))
  expect(steamStatus(res as never)).toBe('error')
})
