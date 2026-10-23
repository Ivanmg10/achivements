import { useCallback, useEffect, useRef, useState } from 'react'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useVaultFillState } from '@/context/VaultFillContext'
import type { RankingsResponse, RankRow } from '@/app/api/rankings/route'
import type { RankPeriod, RankScope, RankSort, RankSource } from '@/lib/rankings'

/** `sort` left out is by points. */
export type RankingsView = { scope: RankScope; period: RankPeriod; source: RankSource; sort?: RankSort }
type ZoneSize = { above: number; below: number }

/** "Your zone" starts with two on each side and widens ten at a time, up to fifty (the API's limit). */
const ZONE: ZoneSize = { above: 2, below: 2 }
const ZONE_STEP = 10
export const ZONE_MAX = 50

async function request(view: RankingsView, offset: number, zone: ZoneSize): Promise<RankingsResponse | null> {
  try {
    const qs = new URLSearchParams({
      scope: view.scope, period: view.period, source: view.source, offset: String(offset), above: String(zone.above), below: String(zone.below),
    })
    if (view.sort && view.sort !== 'points') qs.set('sort', view.sort)
    const res = await fetch(`/api/rankings?${qs}`)
    if (!res.ok) throw new Error(`rankings ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data?.rows)) throw new Error('Unexpected rankings')
    return data as RankingsResponse
  } catch (err) {
    console.error('[useRankings]', err)
    return null
  }
}

/**
 * One view of the rankings, twenty at a time: `more()` appends the next twenty,
 * and `widen()` shows more of the viewer's zone above or below them. Changing
 * the view starts over. `error` when the first page could not be read; a later
 * page or a wider zone that fails only stops it growing (and says so).
 */
export function useRankings(view: RankingsView, enabled = true) {
  const key = `${view.scope}|${view.period}|${view.source}|${view.sort ?? 'points'}`
  const [data, setData] = useState<RankingsResponse | null>(null)
  const [rows, setRows] = useState<RankRow[]>([])
  const [answered, setAnswered] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [moreFailed, setMoreFailed] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [zoneSize, setZoneSize] = useState<ZoneSize>(ZONE)
  const [widening, setWidening] = useState(false)
  // The refresh after a fill keeps the zone as wide as it was, without asking again for every widening.
  const zoneRef = useRef<ZoneSize>(ZONE)
  // After every pass of the viewer's fill, their row may have moved.
  const fillVersion = useVaultFillState()?.version ?? 0

  // Another view: what was shown belongs to the old one.
  useWhenChanged([key], () => {
    setData(null)
    setRows([])
    setFailed(false)
    setMoreFailed(false)
    setZoneSize(ZONE)
  })

  useEffect(() => {
    if (!enabled) return
    let current = true
    const [scope, period, source, sort] = key.split('|') as [RankScope, RankPeriod, RankSource, RankSort]
    zoneRef.current = answered === key ? zoneRef.current : ZONE
    request({ scope, period, source, sort }, 0, zoneRef.current).then((res) => {
      if (!current) return
      setData(res)
      setRows(res?.rows ?? [])
      setFailed(res === null)
      setAnswered(key)
    })
    return () => {
      current = false
    }
    // `answered` only tells a refresh from a new view; it must not start a request of its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, attempt, fillVersion])

  const retry = useCallback(() => {
    setAnswered(null)
    setAttempt((n) => n + 1)
  }, [])

  const more = useCallback(async () => {
    if (!data || loadingMore) return
    setLoadingMore(true)
    setMoreFailed(false)
    const res = await request({ scope: data.scope, period: data.period, source: data.source, sort: data.sort }, rows.length, zoneRef.current)
    setLoadingMore(false)
    if (!res) {
      setMoreFailed(true)
      return
    }
    setRows((r) => [...r, ...res.rows])
  }, [data, rows.length, loadingMore])

  const widen = useCallback(
    async (side: 'up' | 'down') => {
      if (!data || widening) return
      const key = side === 'up' ? 'above' : 'below'
      const next = { ...zoneRef.current, [key]: Math.min(ZONE_MAX, zoneRef.current[key] + ZONE_STEP) }
      setWidening(true)
      setMoreFailed(false)
      const res = await request({ scope: data.scope, period: data.period, source: data.source, sort: data.sort }, 0, next)
      setWidening(false)
      if (!res) {
        setMoreFailed(true)
        return
      }
      zoneRef.current = next
      setZoneSize(next)
      setData((d) => (d ? { ...d, zone: res.zone, zoneStart: res.zoneStart } : d))
    },
    [data, widening],
  )

  return {
    data,
    rows,
    isLoading: enabled && answered !== key,
    error: answered === key && failed,
    retry,
    more,
    hasMore: data !== null && rows.length < data.total,
    loadingMore,
    moreFailed,
    widen,
    widening,
    zoneSize,
  }
}
