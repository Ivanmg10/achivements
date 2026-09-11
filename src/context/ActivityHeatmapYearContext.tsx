'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentAchievement } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

type CtxType = {
  achievements: RecentAchievement[]
  isLoading: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({ achievements: [], isLoading: true, refetch: () => {} })

export function ActivityHeatmapYearProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    fetchWithRetry('/api/getActivityHeatmapYear')
      .then((data) => {
        if (!Array.isArray(data)) {
          const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
          attemptRef.current++
          retryTimer.current = setTimeout(doFetch, delay)
          return
        }
        setAchievements(data as RecentAchievement[])
        setIsLoading(false)
        attemptRef.current = 0
      })
      .catch(() => {
        const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
        attemptRef.current++
        retryTimer.current = setTimeout(doFetch, delay)
      })
  }, [session?.user?.rausername])

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setAchievements([])
    doFetch()
  }, [doFetch])

  return <Ctx.Provider value={{ achievements, isLoading, refetch }}>{children}</Ctx.Provider>
}

export const useActivityHeatmapYear = () => useContext(Ctx)
