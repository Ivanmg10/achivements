import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentlyPlayedGame } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

export function useRecentlyPlayedGames() {
  const { status } = useSession()
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      fetchWithRetry('/api/getRecentlyPlayedGames')
        .then((data) => Array.isArray(data) && setGames(data as RecentlyPlayedGame[]))
    }
  }, [status])

  return games
}
