import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentlyPlayedGame } from '@/types/types'

export function useRecentlyPlayedGames() {
  const { status } = useSession()
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      fetch('/api/getRecentlyPlayedGames')
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setGames(data))
    }
  }, [status])

  return games
}
