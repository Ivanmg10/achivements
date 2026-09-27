import { NextResponse } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getAchievementsEarnedBetween } from '@/lib/raClient'

const DAY = 24 * 60 * 60
const CHUNK_DAYS = 30
const TOTAL_DAYS = 365

const TTL_CURRENT = 15 * 60 * 1000
/** A month that has already ended cannot gain achievements. */
const TTL_SETTLED = 7 * 24 * 60 * 60 * 1000

/** RA calls in flight at once. Twelve at a time is how a year got throttled. */
const CONCURRENCY = 3

export type HeatmapBucket = { from: number; to: number }

/**
 * The 30-day buckets covering the last year, anchored to fixed boundaries
 * rather than to "now".
 *
 * That anchoring is the point: a bucket keyed off the current second is a
 * cache key that never repeats, so every visit re-asked RA for the whole year
 * — twelve calls at once, every time, which is what got them throttled into
 * the empty months this was meant to draw.
 */
export function heatmapBuckets(nowSeconds: number): HeatmapBucket[] {
  const bucket = CHUNK_DAYS * DAY
  const newest = Math.floor(nowSeconds / bucket) * bucket
  const oldest = newest - Math.ceil(TOTAL_DAYS / CHUNK_DAYS) * bucket

  const buckets: HeatmapBucket[] = []
  for (let from = oldest; from <= newest; from += bucket) {
    buckets.push({ from, to: from + bucket })
  }
  return buckets
}

export async function GET() {
  const auth = await requireRaSession()
  if (!auth.ok) return auth.response
  const { id, rausername, raid } = auth.session

  const now = Math.floor(Date.now() / 1000)
  const buckets = heatmapBuckets(now)

  const loadBucket = ({ from, to }: HeatmapBucket) =>
    withCache(
      `heatmapYear_bucket_v1:${id}:${from}`,
      to <= now ? TTL_SETTLED : TTL_CURRENT,
      () => getAchievementsEarnedBetween(rausername, raid, from, to),
      (d) => Array.isArray(d),
    )

  try {
    const merged: unknown[] = []
    // In batches, so a year is never twelve simultaneous calls to RA.
    for (let i = 0; i < buckets.length; i += CONCURRENCY) {
      const batch = await Promise.all(
        buckets.slice(i, i + CONCURRENCY).map((b) =>
          // One retry: a throttled bucket used to be swallowed as an empty
          // month, which reads as "you played nothing" and is a lie.
          loadBucket(b).catch(() => loadBucket(b)),
        ),
      )
      for (const chunk of batch) merged.push(...(chunk as unknown[]))
    }
    return cachedJson(merged, TTL_CURRENT)
  } catch (err) {
    // Rather than draw a hole: the buckets that did load stay cached, so the
    // client's retry only costs the one that failed.
    console.error('[getActivityHeatmapYear]', err)
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
