jest.mock('@/lib/apiAuth', () => ({ requireRaSession: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getAchievementsEarnedBetween: jest.fn() }))

import { GET } from './route'
import { NextResponse } from 'next/server'
import { requireRaSession } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getAchievementsEarnedBetween } from '@/lib/raClient'

const DAY = 24 * 3600
const NOW = Date.UTC(2026, 5, 15, 12) / 1000

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers({ now: NOW * 1000 })
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: true, session: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

afterEach(() => jest.useRealTimers())

test('passes on the auth answer', async () => {
  const denied = NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  ;(requireRaSession as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET()).toBe(denied)
})

test('joins the last 60 days, asked for in two 30-day halves', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock).mockResolvedValueOnce([{ a: 1 }]).mockResolvedValueOnce([{ b: 2 }])
  const res = await GET()
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toEqual([{ a: 1 }, { b: 2 }])
  expect(getAchievementsEarnedBetween).toHaveBeenCalledWith('ivan', 'key', NOW - 30 * DAY, NOW)
  expect(getAchievementsEarnedBetween).toHaveBeenCalledWith('ivan', 'key', NOW - 60 * DAY, NOW - 30 * DAY)
})

test('503 when either half fails, so a partial heatmap is never cached', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('RA down'))
  expect((await GET()).status).toBe(503)
})
