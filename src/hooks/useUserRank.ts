import { UserRankAndScore } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

export function useUserRank() {
  const { data: session } = useSession()
  const [rank, setRank] = useState<UserRankAndScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetchWithRetry('/api/getUserRankAndScore')
      .then((data) => setRank(data as UserRankAndScore))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [session?.user?.rausername])

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  const refetch = useCallback(() => { setRank(null); doFetch() }, [doFetch])

  return { rank, isLoading, error, refetch }
}
