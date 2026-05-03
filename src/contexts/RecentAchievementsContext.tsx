'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RecentAchievement } from '@/types/types'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

type CtxType = {
  achievements: RecentAchievement[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({ achievements: [], isLoading: true, error: false, refetch: () => {} })

export function RecentAchievementsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetchWithRetry('/api/getRecentAchievements')
      .then((data) => {
        if (!Array.isArray(data)) return
        setAchievements([...data].sort(
          (a, b) => new Date(b.Date.replace(' ', 'T')).getTime() - new Date(a.Date.replace(' ', 'T')).getTime()
        ))
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [session?.user?.rausername])

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  const refetch = useCallback(() => {
    setAchievements([])
    doFetch()
  }, [doFetch])

  return <Ctx.Provider value={{ achievements, isLoading, error, refetch }}>{children}</Ctx.Provider>
}

export const useRecentAchievements = () => useContext(Ctx)
