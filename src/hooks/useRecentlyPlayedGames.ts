import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentlyPlayedGame } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

export function useRecentlyPlayedGames() {
  const { status } = useSession()
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated') return
    fetchWithRetry('/api/getRecentlyPlayedGames')
      .then((data) => {
        if (!Array.isArray(data)) {
          const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
          attemptRef.current++
          retryTimer.current = setTimeout(doFetch, delay)
          return
        }
        setGames(data as RecentlyPlayedGame[])
        attemptRef.current = 0
      })
      .catch(() => {
        const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
        attemptRef.current++
        retryTimer.current = setTimeout(doFetch, delay)
      })
  }, [status])

  useEffect(() => {
    if (status === 'unauthenticated') {
      hasFetched.current = false
      clearTimeout(retryTimer.current)
      attemptRef.current = 0
      setGames([])
      return
    }
    if (status !== 'authenticated' || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  return games
}
