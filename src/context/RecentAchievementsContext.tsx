'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RecentAchievement } from '@/types/types'
import { useSession } from 'next-auth/react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'

type CtxType = {
  achievements: RecentAchievement[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({ achievements: [], isLoading: true, error: false, refetch: () => {} })

export function RecentAchievementsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    const onFail = (err?: unknown) => {
      if (!scheduleRetry(attemptRef, retryTimer, doFetch, err)) { setError(true); setIsLoading(false) }
    }
    fetchWithRetry('/api/getRecentAchievements')
      .then((data) => {
        if (!Array.isArray(data)) return onFail()
        setAchievements([...data].sort(
          (a, b) => new Date(b.Date.replace(' ', 'T')).getTime() - new Date(a.Date.replace(' ', 'T')).getTime()
        ))
        setIsLoading(false)
        attemptRef.current = 0
      })
      .catch(onFail)
  }, [session?.user?.rausername])

  useEffect(() => {
    if (status === 'unauthenticated') {
      hasFetched.current = false
      clearTimeout(retryTimer.current)
      attemptRef.current = 0
      setAchievements([])
      setIsLoading(false)
      return
    }
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setAchievements([])
    doFetch()
  }, [doFetch])

  return <Ctx.Provider value={{ achievements, isLoading, error, refetch }}>{children}</Ctx.Provider>
}

export const useRecentAchievements = () => useContext(Ctx)
