import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGamesData } from '@/context/GamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'

export type AllGamesGlobal = {
  wantToPlay: WantToPlayGame[]
  playing: RetroAchievementsGameCompleted[]
  completed: RetroAchievementsGameCompleted[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const WANT_URL = '/api/getWantPlayGames'

export function useAllGamesGlobal(): AllGamesGlobal {
  const { data: session, status } = useAuthSession()
  const rausername = session?.user?.rausername
  const { isHidden } = useHiddenGames()
  // Completed/in-progress games are fetched once and shared app-wide via
  // GamesDataContext — don't re-fetch /api/getGamesCompleted here too.
  const { all: allCompleted, isLoading: completedLoading, error: completedError, refetch: refetchCompleted } = useGamesData()
  // Keyed by the RA account too: another one linked never paints the last one's answers.
  const user = session?.user?.id ? `${session.user.id}:${session.user.rausername ?? ''}` : undefined
  // Coming back: the list as it showed, at once, while it is read again (lastAnswers).
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>(() => lastAnswer<WantToPlayGame[]>(user, WANT_URL) ?? [])
  const [wantLoading, setWantLoading] = useState(() => lastAnswer(user, WANT_URL) === undefined)
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
      fetchWithRetry(WANT_URL)
        .then((wantData) => {
          const wantResults: WantToPlayGame[] = (wantData as { Results?: WantToPlayGame[] })?.Results ?? []
          keepAnswer(user, WANT_URL, wantResults)
          setWantToPlay(wantResults)
          setWantLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [status, rausername, user])

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
    () => wantToPlay.filter((g) => !startedIds.has(g.ID ?? g.GameID!) && g.ConsoleName !== 'Events' && !isHidden(g.ID ?? g.GameID!, 'ra')),
    [wantToPlay, startedIds, isHidden],
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
