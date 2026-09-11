import { useEffect, useRef, useState } from 'react'
import { RecentlyPlayedGame } from '@/types/types'

export function usePublicUserRecentlyPlayed(raUsername: string) {
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!raUsername || fetchedFor.current === raUsername) return
    fetchedFor.current = raUsername
    setGames([])
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
