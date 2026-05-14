import { WantToPlayGame } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useGamesData } from '@/context/GamesDataContext'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'

export function useWantGamesPreview() {
  const { status } = useSession()
  const { all: completedGames } = useGamesData()
  const [wantGames, setWantGames] = useState<WantToPlayGame[]>([])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated') { setLoading(false); return }
    setLoading(true)
    fetchWithRetry('/api/getWantPlayGames')
      .then((data) => {
        const results = (data as { Results?: WantToPlayGame[] })?.Results ?? []
        setWantGames(results.sort(() => Math.random() - 0.5).slice(0, 7))
        setLoading(false)
        attemptRef.current = 0
      })
      .catch(() => {
        const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
        attemptRef.current++
        retryTimer.current = setTimeout(doFetch, delay)
      })
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const startedIds = useMemo(
    () => new Set(completedGames.filter((g) => g.NumAwarded > 0).map((g) => g.GameID)),
    [completedGames],
  )

  const filteredGames = useMemo(
    () => wantGames.filter((g) => !startedIds.has(g.ID ?? g.GameID!)),
    [wantGames, startedIds],
  )

  return { wantGames: filteredGames, loading }
}
