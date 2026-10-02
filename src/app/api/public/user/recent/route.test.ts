jest.mock('@/lib/apiAuth', () => ({ requireViewerApiKey: jest.fn() }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getAchievementsEarnedBetween: jest.fn() }))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { getAchievementsEarnedBetween } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/public/user/recent?${query}`)
const DAY = 24 * 3600
const NOW = Date.UTC(2026, 5, 15, 12) / 1000

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers({ now: NOW * 1000 })
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: true, viewerId: '1', apiKey: 'viewer-key' })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

afterEach(() => jest.useRealTimers())

test('a viewer who cannot ask RA gets the auth answer', async () => {
  const denied = NextResponse.json({ message: 'No RA account linked' }, { status: 400 })
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(request('u=Ivan'))).toBe(denied)
})

test('400 without a username', async () => {
  expect((await GET(request(''))).status).toBe(400)
})

test('covers the last year in 30-day pieces and joins them', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock).mockImplementation((_u: string, _k: string, from: number) =>
    Promise.resolve([{ from }]),
  )
  const res = await GET(request('u=Ivan'))
  expect(res.status).toBe(200)

  const calls = (getAchievementsEarnedBetween as jest.Mock).mock.calls
  expect(calls).toHaveLength(13)
  expect(calls[0]).toEqual(['Ivan', 'viewer-key', NOW - 30 * DAY, NOW])
  expect(calls[12]).toEqual(['Ivan', 'viewer-key', NOW - 365 * DAY, NOW - 360 * DAY])
  expect((res as unknown as { data: unknown[] }).data).toHaveLength(13)
  expect(res.headers.get('Cache-Control')).toMatch(/^private/)
})

test('recent pieces are cached briefly, old ones for a day, keyed per user in any case', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock).mockResolvedValue([])
  await GET(request('u=Ivan'))
  const calls = (withCache as jest.Mock).mock.calls
  expect(calls[0][0]).toBe(`publicHeatmapYear:ivan:${NOW - 30 * DAY}`)
  expect(calls[0][1]).toBe(15 * 60 * 1000)
  expect(calls[12][1]).toBe(24 * 60 * 60 * 1000)
})

test('a piece that fails is left out, the rest still answer', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock)
    .mockRejectedValueOnce(new Error('RA hiccup'))
    .mockResolvedValue([{ ok: true }])
  const res = await GET(request('u=Ivan'))
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown[] }).data).toHaveLength(12)
})

test('502 when every piece fails', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock).mockRejectedValue(new Error('RA down'))
  expect((await GET(request('u=Ivan'))).status).toBe(502)
})
