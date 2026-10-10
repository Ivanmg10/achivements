'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { useSession } from 'next-auth/react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { withSubject } from '@/utils/withSubject'

type CtxType = {
  all: RetroAchievementsGameCompleted[]
  softcore: RetroAchievementsGameCompleted[]
  hardcore: RetroAchievementsGameCompleted[]
  inProgress: RetroAchievementsGameCompleted[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({
  all: [], softcore: [], hardcore: [], inProgress: [],
  isLoading: true, error: false, refetch: () => {},
})

const RA_SYSTEM_CONSOLE_IDS = new Set([100, 101])
function isRealGame(g: RetroAchievementsGameCompleted) {
  return !RA_SYSTEM_CONSOLE_IDS.has(g.ConsoleID)
}

export function GamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const subject = useSubject()
  const rausername = session?.user?.rausername
  const [all, setAll] = useState<RetroAchievementsGameCompleted[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    // Named, so a retry can call it again.
    const run = () => {
      if (status !== 'authenticated' || !rausername) return
      const onFail = (err?: unknown) => {
        if (!scheduleRetry(attemptRef, retryTimer, run, err)) { setError(true); setIsLoading(false) }
      }
      fetchWithRetry(withSubject('/api/getGamesCompleted', subject))
        .then((data) => {
          if (!Array.isArray(data)) return onFail()
          setAll((data as RetroAchievementsGameCompleted[]).filter(isRealGame))
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [status, rausername, subject])

  const signedOut = status === 'unauthenticated'
  const unlinked = status === 'authenticated' && !rausername
  const canFetch = status === 'authenticated' && Boolean(rausername)

  // Starting over is state, so it happens while rendering; the refs and the fetch stay in the effect.
  // Not keyed on canFetch: session.update() makes status flip to 'loading' and back, and that must
  // not start a load the effect (it fetches once per sign-in) will never answer.
  useWhenChanged([signedOut, unlinked], () => {
    if (signedOut) {
      setAll([])
      setIsLoading(false)
    } else if (unlinked) {
      setIsLoading(false)
    } else {
      setIsLoading(true)
      setError(false)
    }
  })

  useEffect(() => {
    if (signedOut) {
      hasFetched.current = false
      clearTimeout(retryTimer.current)
      attemptRef.current = 0
      return
    }
    if (!canFetch || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [signedOut, canFetch, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setAll([])
    setIsLoading(true)
    setError(false)
    doFetch()
  }, [doFetch])

  const softcore = useMemo(() => all.filter((g) => g.HardcoreMode === '0'), [all])
  const hardcore = useMemo(() => all.filter((g) => g.HardcoreMode === '1'), [all])
  const inProgress = useMemo(
    () =>
      all
        .filter((g) => Number(g.HardcoreMode) === 0 && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1)
        .sort((a, b) => a.GameID - b.GameID),
    [all]
  )

  return (
    <Ctx.Provider value={{ all, softcore, hardcore, inProgress, isLoading, error, refetch }}>
      {children}
    </Ctx.Provider>
  )
}

export const useGamesData = () => useContext(Ctx)
