import { UserRankAndScore } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'

export function useUserRank() {
  const { data: session } = useSession()
  const [rank, setRank] = useState<UserRankAndScore | null>(null)
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
    fetchWithRetry('/api/getUserRankAndScore')
      .then((data) => {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !('Rank' in data)) return onFail()
        setRank(data as UserRankAndScore)
        setIsLoading(false)
        attemptRef.current = 0
      })
      .catch(onFail)
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
    setRank(null)
    doFetch()
  }, [doFetch])

  return { rank, isLoading, error, refetch }
}
