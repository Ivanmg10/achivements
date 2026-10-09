jest.mock('@/lib/apiAuth', () => ({ requireRaSession: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getUserProfile: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { requireRaSession } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getUserProfile } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/public/user/profile?${query}`)

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: true, session: { id: '7', rausername: 'IvanRA', raid: 'a-key' } })
  // A cache miss: the fetcher runs.
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('without a key to read RA with, the auth answer comes back and RA is not called', async () => {
  const denied = NextResponse.json({ message: 'No RA account linked' }, { status: 400 })
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(request('user=ivan'))).toBe(denied)
  expect(getUserProfile).not.toHaveBeenCalled()
})

test('400 without a user', async () => {
  expect((await GET(request(''))).status).toBe(400)
  expect(getUserProfile).not.toHaveBeenCalled()
})

test('asks RA for that user\'s name with the key it was given, caches per user, and only privately', async () => {
  ;(getUserProfile as jest.Mock).mockResolvedValue({ User: 'Ivan' })
  const res = await GET(request('user=ivan'))
  expect(res.status).toBe(200)
  expect(getUserProfile).toHaveBeenCalledWith('IvanRA', 'a-key')
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('publicProfile:ivanra')
  expect(res.headers.get('Cache-Control')).toMatch(/^private/)
})

test('only a well-formed answer is cached', () => {
  return GET(request('user=ivan')).then(() => {
    const isValid = (withCache as jest.Mock).mock.calls[0][3] as (d: unknown) => boolean
    expect(isValid({ User: 'Ivan' })).toBe(true)
    expect(isValid(null)).toBe(false)
    expect(isValid({ error: 'nope' })).toBe(false)
  })
})

test('502 when RA fails', async () => {
  ;(getUserProfile as jest.Mock).mockRejectedValue(new Error('RA down'))
  expect((await GET(request('user=ivan'))).status).toBe(502)
})
