import { PopularGame } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

export function usePopularUnplayed() {
  const { data: session } = useSession()
  const [games, setGames] = useState<PopularGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetchWithRetry('/api/getPopularUnplayed')
      .then((data) => { if (Array.isArray(data)) setGames(data as PopularGame[]) })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [session?.user?.rausername])

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  const refetch = useCallback(() => { setGames([]); doFetch() }, [doFetch])

  return { games, isLoading, error, refetch }
}
