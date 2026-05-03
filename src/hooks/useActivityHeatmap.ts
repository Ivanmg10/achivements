import { RecentAchievement } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
    fetch('/api/getActivityHeatmap')
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json() })
      .then((data) => { if (Array.isArray(data)) setAchievements(data) })
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
