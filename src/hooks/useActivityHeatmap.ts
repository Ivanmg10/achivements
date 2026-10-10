import { RecentAchievement } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

export function useActivityHeatmap() {
  const { data: session } = useSession()
  const subject = useSubject()
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    // Named, so a retry can call it again.
    const run = () => {
      if (!session?.user?.rausername) return
      const onFail = (err?: unknown) => {
        if (!scheduleRetry(attemptRef, retryTimer, run, err)) { setError(true); setIsLoading(false) }
      }
      fetchWithRetry(withSubject('/api/getActivityHeatmap', subject))
        .then((data) => {
          if (!Array.isArray(data)) return onFail()
          setAchievements(data as RecentAchievement[])
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [session?.user?.rausername, subject])

  useEffect(() => {
    if (!session?.user?.rausername || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setAchievements([])
    setIsLoading(true)
    setError(false)
    doFetch()
  }, [doFetch])

  // Nobody to load for is not loading, whatever the last request left behind.
  return { achievements, isLoading: Boolean(session?.user?.rausername) && isLoading, error, refetch }
}
