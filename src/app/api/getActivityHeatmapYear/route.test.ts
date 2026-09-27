jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn(), clearCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getAchievementsEarnedBetween: jest.fn() }))

import { GET, heatmapBuckets } from './route'
import { getServerSession } from 'next-auth'
import { withCache } from '@/lib/raCache'
import { getAchievementsEarnedBetween } from '@/lib/raClient'

const DAY = 24 * 60 * 60
const NOW = 1_727_000_000 // a fixed moment, so the buckets are checkable

/** Runs the fetcher and remembers the key, the way the real cache would. */
function passthroughCache() {
  ;(withCache as jest.Mock).mockImplementation(
    async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher(),
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(getAchievementsEarnedBetween as jest.Mock).mockResolvedValue([])
  passthroughCache()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

describe('heatmapBuckets', () => {
  test('covers a year and lands on the same boundaries whatever the second', () => {
    const early = heatmapBuckets(NOW)
    const later = heatmapBuckets(NOW + 3600)

    expect(early).toEqual(later)
    const span = (early[early.length - 1].to - early[0].from) / DAY
    expect(span).toBeGreaterThanOrEqual(365)
  })

  test('the buckets touch, so no day falls between two of them', () => {
    const buckets = heatmapBuckets(NOW)
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].from).toBe(buckets[i - 1].to)
    }
  })

  test('the newest bucket contains today', () => {
    const buckets = heatmapBuckets(NOW)
    const newest = buckets[buckets.length - 1]
    expect(newest.from).toBeLessThanOrEqual(NOW)
    expect(newest.to).toBeGreaterThan(NOW)
  })
})

test('caches every bucket under a key that repeats across requests', async () => {
  await GET()
  const firstKeys = (withCache as jest.Mock).mock.calls.map(([key]) => key)

  jest.clearAllMocks()
  passthroughCache()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(getAchievementsEarnedBetween as jest.Mock).mockResolvedValue([])
  await GET()

  expect((withCache as jest.Mock).mock.calls.map(([key]) => key)).toEqual(firstKeys)
})

test('a settled month is kept far longer than the one still running', async () => {
  await GET()
  const ttls = (withCache as jest.Mock).mock.calls.map(([, ttl]) => ttl)

  expect(ttls[ttls.length - 1]).toBe(15 * 60 * 1000)
  expect(ttls[0]).toBe(7 * 24 * 60 * 60 * 1000)
})

test('merges every bucket into one list', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock).mockResolvedValue([{ Date: '2024-06-01 10:00:00' }])
  const res = await GET()
  const data = (res as unknown as { data: unknown[] }).data

  expect(data).toHaveLength(heatmapBuckets(Math.floor(Date.now() / 1000)).length)
})

test('retries a bucket that fails once, rather than reporting an empty month', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock)
    .mockRejectedValueOnce(new Error('throttled'))
    .mockResolvedValue([{ Date: '2024-06-01 10:00:00' }])

  const res = await GET()
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown[] }).data.length).toBeGreaterThan(0)
})

test('a month that will not load is an error, never a blank month', async () => {
  ;(getAchievementsEarnedBetween as jest.Mock).mockRejectedValue(new Error('throttled'))

  const res = await GET()
  expect(res.status).toBe(503)
})

test('returns 400 without a linked RA account', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  expect((await GET()).status).toBe(400)
})
