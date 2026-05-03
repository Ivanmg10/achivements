import { UserAwards } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useUserAwards() {
  const { data: session } = useSession()
  const [awards, setAwards] = useState<UserAwards | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    setIsLoading(true)
    setError(false)
    fetch('/api/getUserAwards')
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json() })
      .then((data) => setAwards(data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [session?.user?.rausername])

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  const refetch = useCallback(() => { setAwards(null); doFetch() }, [doFetch])

  return { awards, isLoading, error, refetch }
}
