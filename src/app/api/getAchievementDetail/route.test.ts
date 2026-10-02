jest.mock('@/lib/apiAuth', () => ({ requireRaSession: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getAchievementUnlocks: jest.fn(), getAchievementComments: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { requireRaSession } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getAchievementComments, getAchievementUnlocks } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/getAchievementDetail?${query}`)

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: true, session: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('passes on the auth answer', async () => {
  const denied = NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(request('achievementId=5'))).toBe(denied)
})

test('400 for a missing or non-numeric id', async () => {
  expect((await GET(request(''))).status).toBe(400)
  expect((await GET(request('achievementId=5;drop'))).status).toBe(400)
})

test('answers with unlocks and comments, cached per user', async () => {
  ;(getAchievementUnlocks as jest.Mock).mockResolvedValue({ UnlocksCount: 3 })
  ;(getAchievementComments as jest.Mock).mockResolvedValue({ Results: [] })
  const res = await GET(request('achievementId=5'))
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toEqual({ unlocks: { UnlocksCount: 3 }, comments: { Results: [] } })
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('achievementDetail:1:5')
})

test('one half failing still answers with the other', async () => {
  ;(getAchievementUnlocks as jest.Mock).mockRejectedValue(new Error('RA down'))
  ;(getAchievementComments as jest.Mock).mockResolvedValue({ Results: [] })
  const res = await GET(request('achievementId=5'))
  expect((res as unknown as { data: { unlocks: unknown } }).data.unlocks).toBeNull()
})

test('503 when the cache itself fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(withCache as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await GET(request('achievementId=5'))).status).toBe(503)
})
