import { useEffect, useRef, useState } from 'react'
import { UserAwards } from '@/types/types'

export function usePublicUserAwards(raUsername: string) {
  const [awards, setAwards] = useState<UserAwards | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!raUsername || hasFetched.current) return
    hasFetched.current = true
    setIsLoading(true)
    fetch(`/api/public/user/awards?u=${encodeURIComponent(raUsername)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        setAwards(data?.TotalAwardsCount != null ? data : null)
        setIsLoading(false)
      })
      .catch(() => {
        setAwards(null)
        setIsLoading(false)
      })
  }, [raUsername])

  return { awards, isLoading }
}
