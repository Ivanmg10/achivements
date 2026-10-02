jest.mock('@/lib/apiAuth', () => ({ requireRaSession: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getGameHashes: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { requireRaSession } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getGameHashes } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/getGameHashes?${query}`)

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
  expect((await GET(request('gameId=1e3'))).status).toBe(400)
})

test('answers with the hashes, cached per game', async () => {
  ;(getGameHashes as jest.Mock).mockResolvedValue({ Results: [{ MD5: 'abc' }] })
  const res = await GET(request('gameId=42'))
  expect(res.status).toBe(200)
  expect(getGameHashes).toHaveBeenCalledWith('42', 'key')
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('gameHashes:42')
})

test('an empty list when RA fails: the hashes are an extra, not the page', async () => {
  ;(getGameHashes as jest.Mock).mockRejectedValue(new Error('RA down'))
  const res = await GET(request('gameId=42'))
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toEqual({ Results: [] })
})
