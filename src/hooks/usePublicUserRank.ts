import { useEffect, useRef, useState } from 'react'
import { UserRankAndScore } from '@/types/types'

export function usePublicUserRank(raUsername: string) {
  const [rank, setRank] = useState<UserRankAndScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!raUsername || fetchedFor.current === raUsername) return
    fetchedFor.current = raUsername
    setRank(null)
    setIsLoading(true)
    fetch(`/api/public/user/rank?u=${encodeURIComponent(raUsername)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        setRank(data?.Rank != null ? data : null)
        setIsLoading(false)
      })
      .catch(() => {
        setRank(null)
        setIsLoading(false)
      })
  }, [raUsername])

  return { rank, isLoading }
}
