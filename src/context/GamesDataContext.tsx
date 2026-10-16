'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { useSession } from 'next-auth/react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useHiddenConsoles } from '@/hooks/useHiddenConsoles'
import { consoleOptions, filterByConsole, type ConsoleOption } from '@/utils/consoleFilter'
import { withSubject } from '@/utils/withSubject'

type CtxType = {
  /** Every game, without the consoles unticked in preferences. */
  all: RetroAchievementsGameCompleted[]
  /** The consoles in the list, for the preferences to tick. */
  consoles: ConsoleOption[]
  softcore: RetroAchievementsGameCompleted[]
  hardcore: RetroAchievementsGameCompleted[]
  inProgress: RetroAchievementsGameCompleted[]
  isLoading: boolean
  error: boolean
  /** RetroAchievements does not accept the saved API key (revoked or regenerated): linking again is the fix, not waiting. */
  keyInvalid: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({
  all: [], consoles: [], softcore: [], hardcore: [], inProgress: [],
  isLoading: true, error: false, keyInvalid: false, refetch: () => {},
})

const RA_SYSTEM_CONSOLE_IDS = new Set([100, 101])
function isRealGame(g: RetroAchievementsGameCompleted) {
  return !RA_SYSTEM_CONSOLE_IDS.has(g.ConsoleID)
}

export function GamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const subject = useSubject()
  const rausername = session?.user?.rausername
  const { hidden } = useHiddenConsoles('ra')
  const [loaded, setAll] = useState<RetroAchievementsGameCompleted[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [keyInvalid, setKeyInvalid] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    // Named, so a retry can call it again.
    const run = () => {
      if (status !== 'authenticated' || !rausername) return
      const onFail = (err?: unknown) => {
        // The routes answer 403 only for a key RA refuses (see raUnavailable).
        if ((err as { status?: number } | undefined)?.status === 403) setKeyInvalid(true)
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
      setKeyInvalid(false)
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
    setKeyInvalid(false)
    doFetch()
  }, [doFetch])

  // The preference is the viewer's own: someone else's list is shown whole.
  const all = useMemo(() => (subject ? loaded : filterByConsole(loaded, (g) => g.ConsoleName, hidden)), [subject, loaded, hidden])
  const consoles = useMemo(() => consoleOptions(loaded.map((g) => g.ConsoleName)), [loaded])
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
    <Ctx.Provider value={{ all, consoles, softcore, hardcore, inProgress, isLoading, error, keyInvalid, refetch }}>
      {children}
    </Ctx.Provider>
  )
}

export const useGamesData = () => useContext(Ctx)
