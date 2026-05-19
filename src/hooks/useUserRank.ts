import { UserRankAndScore } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

export function useUserRank() {
  const { data: session } = useSession()
  const [rank, setRank] = useState<UserRankAndScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    fetchWithRetry('/api/getUserRankAndScore')
      .then((data) => {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !('Rank' in data)) {
          const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
          attemptRef.current++
          retryTimer.current = setTimeout(doFetch, delay)
          return
        }
        setRank(data as UserRankAndScore)
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
    setRank(null)
    doFetch()
  }, [doFetch])

  return { rank, isLoading, refetch }
}
