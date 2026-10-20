import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/utils/adminFetch'
import type { BalanceRow, FlaggedGame } from '@/app/api/admin/rankings/route'

/** The rankings for the admin panel: the balance between platforms, and the games flagged for an unlock tool. */
export function useAdminRankings() {
  const [balance, setBalance] = useState<BalanceRow[] | null>(null)
  const [flagged, setFlagged] = useState<FlaggedGame[]>([])
  const [loadError, setLoadError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/rankings')
      if (!res.ok) throw new Error(`admin rankings ${res.status}`)
      const data = (await res.json()) as { balance?: BalanceRow[]; flagged?: FlaggedGame[] }
      if (!Array.isArray(data?.balance) || !Array.isArray(data?.flagged)) throw new Error('Unexpected admin rankings')
      setBalance(data.balance)
      setFlagged(data.flagged)
      setLoadError(false)
    } catch (err) {
      console.error('[useAdminRankings] load', err)
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    load()
  }, [load])

  /** Count a flagged game ('cleared') or keep it out again ('suspect'). Whether it was saved. */
  const review = useCallback(
    async (game: FlaggedGame, flag: 'cleared' | 'suspect'): Promise<boolean> => {
      const key = `${game.userId}:${game.source}:${game.gameId}`
      setBusy(key)
      try {
        const res = await adminFetch('/api/admin/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: game.userId, source: game.source, gameId: game.gameId, flag }),
        })
        if (!res.ok) throw new Error(`admin rankings review ${res.status}`)
        setFlagged((list) => list.map((g) => (g === game ? { ...g, flag } : g)))
        return true
      } catch (err) {
        console.error('[useAdminRankings] review', err)
        return false
      } finally {
        setBusy(null)
      }
    },
    [],
  )

  return { balance, flagged, loadError, retry: load, review, busy }
}
