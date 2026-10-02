jest.mock('@/lib/apiAuth', () => ({ requireRaSession: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getGameComments: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { requireRaSession } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getGameComments } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/getGameComments?${query}`)

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: true, session: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('passes on the auth answer', async () => {
  const denied = NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(request('gameId=1'))).toBe(denied)
})

test('400 for a missing or non-numeric game id', async () => {
  expect((await GET(request(''))).status).toBe(400)
  expect((await GET(request('gameId=abc'))).status).toBe(400)
  expect(getGameComments).not.toHaveBeenCalled()
})

test('answers with the comments, cached per game', async () => {
  ;(getGameComments as jest.Mock).mockResolvedValue({ Count: 0, Total: 0, Results: [] })
  const res = await GET(request('gameId=42'))
  expect(res.status).toBe(200)
  expect(getGameComments).toHaveBeenCalledWith('42', 'key')
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('gameComments_v1:42')
})

test('503 when RA fails', async () => {
  ;(getGameComments as jest.Mock).mockRejectedValue(new Error('RA down'))
  expect((await GET(request('gameId=42'))).status).toBe(503)
})
