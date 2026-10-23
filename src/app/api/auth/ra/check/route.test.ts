jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/attemptLimit', () => ({ clientAddress: () => '1.2.3.4', allowAttempt: jest.fn() }))
jest.mock('@/lib/raProfile', () => ({ ...jest.requireActual('@/lib/raProfile'), fetchRaProfile: jest.fn() }))

import { POST } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { allowAttempt } from '@/lib/attemptLimit'
import { fetchRaProfile } from '@/lib/raProfile'

const query = pool.query as jest.Mock

function request(body: unknown) {
  return new NextRequest('https://www.cheevovault.com/api/auth/ra/check', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  query.mockResolvedValue({ rows: [] })
  ;(fetchRaProfile as jest.Mock).mockResolvedValue({ ok: true, profile: { User: 'PalmeraMiami' } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('RA accepts it: the name RA gives and its picture', async () => {
  const res = await POST(request({ username: ' palmeramiami ', apiKey: ' key ' }))
  expect(res.status).toBe(200)
  expect(res.data).toEqual({ user: 'PalmeraMiami', avatar: 'https://media.retroachievements.org/UserPic/PalmeraMiami.png' })
  expect(fetchRaProfile).toHaveBeenCalledWith('palmeramiami', 'key')
  // Nothing is kept: only a read of whether the key is in use.
  expect(query.mock.calls.every(([sql]) => String(sql).startsWith('SELECT'))).toBe(true)
})

test('a key that already links an account here is refused before asking RA', async () => {
  query.mockResolvedValue({ rows: [{}] })
  const res = await POST(request({ username: 'a', apiKey: 'key' }))
  expect(res.status).toBe(409)
  expect(res.data).toEqual({ error: 'key-in-use' })
  expect(fetchRaProfile).not.toHaveBeenCalled()
})

test.each([
  ['RA refuses', { ok: false, error: 'ra-invalid', status: 400 }, 400, 'ra-invalid'],
  ['RA is down', { ok: false, error: 'ra-unavailable', status: 502 }, 502, 'ra-unavailable'],
])('%s: says so', async (_name, answer, status, error) => {
  ;(fetchRaProfile as jest.Mock).mockResolvedValue(answer)
  const res = await POST(request({ username: 'a', apiKey: 'key' }))
  expect(res.status).toBe(status)
  expect(res.data).toEqual({ error })
})

test('limited per address, so it cannot be used to test keys', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValue(false)
  const res = await POST(request({ username: 'a', apiKey: 'key' }))
  expect(res.status).toBe(429)
  expect(allowAttempt).toHaveBeenCalledWith('ra-check', '1.2.3.4')
  expect(fetchRaProfile).not.toHaveBeenCalled()
})

test.each([
  ['no key', { username: 'a' }],
  ['not JSON', 'nope'],
])('%s is a 400', async (_name, body) => {
  expect((await POST(request(body))).status).toBe(400)
})
