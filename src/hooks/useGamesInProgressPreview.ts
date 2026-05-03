import { RetroAchievementsGameCompleted } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useGamesInProgressPreview() {
  const { status } = useSession()
  const [listGames, setListGames] = useState<RetroAchievementsGameCompleted[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated') { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetch('/api/getGamesCompleted')
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json() })
      .then((data) => {
        if (!Array.isArray(data)) return
        const inProgress = data
          .filter((g) => Number(g.HardcoreMode) === 0 && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1)
          .sort(() => Math.random() - 0.5)
        setListGames(inProgress)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated') { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [status, doFetch])

  const refetch = useCallback(() => {
    setListGames([])
    doFetch()
  }, [doFetch])

  return { listGames, isLoading, error, refetch }
}
