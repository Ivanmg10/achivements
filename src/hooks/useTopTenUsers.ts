import { TopTenUser } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

export function useTopTenUsers() {
  const { data: session } = useSession()
  const [topTen, setTopTen] = useState<TopTenUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetchWithRetry('/api/getTopTenUsers')
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json() })
      .then((data) => { if (Array.isArray(data)) setTopTen(data) })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [session?.user?.rausername])

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  const refetch = useCallback(() => { setTopTen([]); doFetch() }, [doFetch])

  return { topTen, isLoading, error, refetch }
}
