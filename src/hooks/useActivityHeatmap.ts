import { RecentAchievement } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

export function useActivityHeatmap() {
  const { data: session } = useSession()
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetchWithRetry('/api/getActivityHeatmap')
      .then((data) => { if (Array.isArray(data)) setAchievements(data as RecentAchievement[]) })
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

  return { achievements, isLoading, error, refetch }
}
