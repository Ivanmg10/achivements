import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGamesData } from '@/context/GamesDataContext'

export type AllGamesGlobal = {
  wantToPlay: WantToPlayGame[]
  playing: RetroAchievementsGameCompleted[]
  completed: RetroAchievementsGameCompleted[]
  loading: boolean
}

export function useAllGamesGlobal(): AllGamesGlobal {
  const { status } = useSession()
  // Completed/in-progress games are fetched once and shared app-wide via
  // GamesDataContext — don't re-fetch /api/getGamesCompleted here too.
  const { all: allCompleted, isLoading: completedLoading } = useGamesData()
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const [wantLoading, setWantLoading] = useState(true)
  const fetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated') { setWantLoading(false); return }
    setWantLoading(true)
    fetchWithRetry('/api/getWantPlayGames')
      .then((wantData) => {
        const wantResults: WantToPlayGame[] = (wantData as { Results?: WantToPlayGame[] })?.Results ?? []
        setWantToPlay(wantResults)
        setWantLoading(false)
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
    if (status === 'unauthenticated') { setWantLoading(false); return }
    if (fetched.current) return
    fetched.current = true
    doFetch()
  }, [status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

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

  return { wantToPlay: filteredWantToPlay, playing, completed, loading: wantLoading || completedLoading }
}
