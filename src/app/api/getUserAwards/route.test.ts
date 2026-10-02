jest.mock('@/lib/apiAuth', () => ({ requireRaSession: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getUserAwards: jest.fn() }))

import { GET } from './route'
import { NextResponse } from 'next/server'
import { requireRaSession } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getUserAwards } from '@/lib/raClient'

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: true, session: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('passes on the auth answer', async () => {
  const denied = NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET()).toBe(denied)
})

test('answers with the awards, cached per user', async () => {
  ;(getUserAwards as jest.Mock).mockResolvedValue({ TotalAwardsCount: 4 })
  const res = await GET()
  expect(res.status).toBe(200)
  expect(getUserAwards).toHaveBeenCalledWith('ivan', 'key')
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('userAwards_v1:1')
})

test('503 when RA fails', async () => {
  ;(getUserAwards as jest.Mock).mockRejectedValue(new Error('RA down'))
  expect((await GET()).status).toBe(503)
})
