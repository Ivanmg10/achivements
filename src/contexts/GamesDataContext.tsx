'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { useSession } from 'next-auth/react'

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

export function GamesDataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [all, setAll] = useState<RetroAchievementsGameCompleted[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated') { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetch('/api/getGamesCompleted')
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json() })
      .then((data) => { if (Array.isArray(data)) setAll(data) })
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
    setAll([])
    doFetch()
  }, [doFetch])

  const softcore = useMemo(() => all.filter((g) => g.HardcoreMode === '0'), [all])
  const hardcore = useMemo(() => all.filter((g) => g.HardcoreMode === '1'), [all])
  const inProgress = useMemo(
    () =>
      all
        .filter((g) => Number(g.HardcoreMode) === 0 && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1)
        .sort(() => Math.random() - 0.5),
    [all]
  )

  return (
    <Ctx.Provider value={{ all, softcore, hardcore, inProgress, isLoading, error, refetch }}>
      {children}
    </Ctx.Provider>
  )
}

export const useGamesData = () => useContext(Ctx)
