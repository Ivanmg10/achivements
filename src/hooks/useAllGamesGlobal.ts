import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGamesData } from '@/context/GamesDataContext'

export type AllGamesGlobal = {
  wantToPlay: WantToPlayGame[]
  playing: RetroAchievementsGameCompleted[]
  completed: RetroAchievementsGameCompleted[]
  loading: boolean
  error: boolean
  refetch: () => void
}

export function useAllGamesGlobal(): AllGamesGlobal {
  const { data: session, status } = useSession()
  const rausername = session?.user?.rausername
  // Completed/in-progress games are fetched once and shared app-wide via
  // GamesDataContext — don't re-fetch /api/getGamesCompleted here too.
  const { all: allCompleted, isLoading: completedLoading, error: completedError, refetch: refetchCompleted } = useGamesData()
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const [wantLoading, setWantLoading] = useState(true)
  const [error, setError] = useState(false)
  const fetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    // Named, so a retry can call it again.
    const run = () => {
      if (status !== 'authenticated' || !rausername) return
      const onFail = (err?: unknown) => {
        if (!scheduleRetry(attemptRef, retryTimer, run, err)) { setError(true); setWantLoading(false) }
      }
      fetchWithRetry('/api/getWantPlayGames')
        .then((wantData) => {
          const wantResults: WantToPlayGame[] = (wantData as { Results?: WantToPlayGame[] })?.Results ?? []
          setWantToPlay(wantResults)
          setWantLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [status, rausername])

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated' || fetched.current) return
    fetched.current = true
    doFetch()
  }, [status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setWantLoading(true)
    setError(false)
    doFetch()
    if (completedError) refetchCompleted()
  }, [doFetch, completedError, refetchCompleted])

  const startedIds = useMemo(
    () => new Set(allCompleted.filter((g) => g.NumAwarded > 0).map((g) => g.GameID)),
    [allCompleted],
  )

  const filteredWantToPlay = useMemo(
    () => wantToPlay.filter((g) => !startedIds.has(g.ID ?? g.GameID!) && g.ConsoleName !== 'Events'),
    [wantToPlay, startedIds],
  )

  const playing = useMemo(() => {
    const inProgress = allCompleted.filter(
      (g) => g.ConsoleName !== 'Events' && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1,
    )
    const best = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of inProgress) {
      const prev = best.get(g.GameID)
      if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
    }
    return Array.from(best.values())
  }, [allCompleted])

  const completed = useMemo(() => {
    const compAll = allCompleted.filter((g) => g.ConsoleName !== 'Events' && parseFloat(g.PctWon) >= 1)
    const best = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of compAll) {
      const prev = best.get(g.GameID)
      if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
    }
    return Array.from(best.values())
  }, [allCompleted])

  // Signed out, or with no RA account, there is no want-to-play list to wait for.
  const noWantList = status === 'unauthenticated' || (status === 'authenticated' && !rausername)

  return { wantToPlay: filteredWantToPlay, playing, completed, loading: (wantLoading && !noWantList) || completedLoading, error: error || completedError, refetch }
}
