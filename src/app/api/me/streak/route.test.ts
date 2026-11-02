jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
// The loaders' own modules, so the real parser and error class load without a database.
jest.mock('@/lib/raYear', () => ({}))
jest.mock('@/lib/steamUnlockYear', () => ({}))
jest.mock('@/lib/psnClient', () => ({}))
jest.mock('@/lib/xboxClient', () => ({}))
jest.mock('@/lib/gameVisibility', () => ({}))
jest.mock('@/lib/meStreak', () => {
  const actual = jest.requireActual('@/lib/meStreak')
  return { ...actual, loadStreak: jest.fn() }
})

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET } from './route'
import { loadStreak, StreakUnavailable } from '@/lib/meStreak'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))

const req = (query = '') => new NextRequest(`http://localhost/api/me/streak${query}`)
const bodyOf = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 7, rausername: 'me', raid: 'key', admin: false } })
})

test('answers the viewer\'s own streak, privately', async () => {
  const streak = { active: { start: '2026-11-01', end: '2026-11-02', days: 2 }, best: null, failed: [] }
  ;(loadStreak as jest.Mock).mockResolvedValue(streak)
  const res = await GET(req('?lang=es&hidden=%7B%22ra%22%3A%5B%22SNES%22%5D%7D'))
  expect(res.status).toBe(200)
  expect(bodyOf(res)).toEqual(streak)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=0')
  expect(res.headers.get('Vary')).toBe('Cookie')
  expect(loadStreak).toHaveBeenCalledWith(
    expect.objectContaining({ id: '7', rausername: 'me', raid: 'key', admin: false }),
    'es',
    { ra: new Set(['SNES']) },
  )
})

test('never answers for someone else: ?user= is ignored', async () => {
  ;(loadStreak as jest.Mock).mockResolvedValue({ active: null, best: null, failed: [] })
  await GET(req('?user=someone'))
  expect((loadStreak as jest.Mock).mock.calls[0][0].id).toBe('7')
})

test('signed out is 401', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET(req())).status).toBe(401)
  expect(loadStreak).not.toHaveBeenCalled()
})

test('a malformed console list is 400, not retried', async () => {
  const res = await GET(req('?hidden=nope'))
  expect(res.status).toBe(400)
  expect(bodyOf(res)).toEqual({ error: 'invalid-hidden', retryable: false })
})

test('every platform failing is a 502 to try again, naming them', async () => {
  ;(loadStreak as jest.Mock).mockRejectedValue(new StreakUnavailable(['ra']))
  const res = await GET(req())
  expect(res.status).toBe(502)
  expect(bodyOf(res)).toEqual({ error: 'upstream', retryable: true, failed: ['ra'] })
})
