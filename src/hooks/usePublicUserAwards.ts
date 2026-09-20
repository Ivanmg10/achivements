import { useEffect, useRef, useState } from 'react'
import { UserAwards } from '@/types/types'

export function usePublicUserAwards(raUsername: string) {
  const [awards, setAwards] = useState<UserAwards | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!raUsername || fetchedFor.current === raUsername) return
    fetchedFor.current = raUsername
    setAwards(null)
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
