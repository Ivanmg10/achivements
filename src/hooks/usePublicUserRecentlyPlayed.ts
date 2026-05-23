import { useEffect, useRef, useState } from 'react'
import { RecentlyPlayedGame } from '@/types/types'

export function usePublicUserRecentlyPlayed(raUsername: string) {
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!raUsername || hasFetched.current) return
    hasFetched.current = true
    setIsLoading(true)
    fetch(`/api/public/user/recentlyPlayed?u=${encodeURIComponent(raUsername)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        setGames(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch(() => {
        setGames([])
        setIsLoading(false)
      })
  }, [raUsername])

  return { games, isLoading }
}
