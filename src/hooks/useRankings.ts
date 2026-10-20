import { useCallback, useEffect, useState } from 'react'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useVaultFillState } from '@/context/VaultFillContext'
import type { RankingsResponse, RankRow } from '@/app/api/rankings/route'
import type { RankPeriod, RankScope, RankSource } from '@/lib/rankings'

export type RankingsView = { scope: RankScope; period: RankPeriod; source: RankSource }

async function request(view: RankingsView, offset: number): Promise<RankingsResponse | null> {
  try {
    const qs = new URLSearchParams({ scope: view.scope, period: view.period, source: view.source, offset: String(offset) })
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
 * One view of the rankings, fifty at a time: `more()` appends the next fifty.
 * Changing the view starts over. `error` when the first page could not be read;
 * a later page that fails only stops the list growing (and says so).
 */
export function useRankings(view: RankingsView, enabled = true) {
  const key = `${view.scope}|${view.period}|${view.source}`
  const [data, setData] = useState<RankingsResponse | null>(null)
  const [rows, setRows] = useState<RankRow[]>([])
  const [answered, setAnswered] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [moreFailed, setMoreFailed] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // After every pass of the viewer's fill, their row may have moved.
  const fillVersion = useVaultFillState()?.version ?? 0

  // Another view: what was shown belongs to the old one.
  useWhenChanged([key], () => {
    setData(null)
    setRows([])
    setFailed(false)
    setMoreFailed(false)
  })

  useEffect(() => {
    if (!enabled) return
    let current = true
    const [scope, period, source] = key.split('|') as [RankScope, RankPeriod, RankSource]
    request({ scope, period, source }, 0).then((res) => {
      if (!current) return
      setData(res)
      setRows(res?.rows ?? [])
      setFailed(res === null)
      setAnswered(key)
    })
    return () => {
      current = false
    }
  }, [key, enabled, attempt, fillVersion])

  const retry = useCallback(() => {
    setAnswered(null)
    setAttempt((n) => n + 1)
  }, [])

  const more = useCallback(async () => {
    if (!data || loadingMore) return
    setLoadingMore(true)
    setMoreFailed(false)
    const res = await request({ scope: data.scope, period: data.period, source: data.source }, rows.length)
    setLoadingMore(false)
    if (!res) {
      setMoreFailed(true)
      return
    }
    setRows((r) => [...r, ...res.rows])
  }, [data, rows.length, loadingMore])

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
  }
}
