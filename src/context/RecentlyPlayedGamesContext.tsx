'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentlyPlayedGame } from '@/types/types'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'

type CtxType = {
  games: RecentlyPlayedGame[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({ games: [], isLoading: true, error: false, refetch: () => {} })

export function RecentlyPlayedGamesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  // No RetroAchievements account means nothing to ask for.
  const rausername = session?.user?.rausername
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated' || !rausername) return
    setIsLoading(true)
    setError(false)
    const onFail = (err?: unknown) => {
      if (!scheduleRetry(attemptRef, retryTimer, doFetch, err)) { setError(true); setIsLoading(false) }
    }
    fetchWithRetry('/api/getRecentlyPlayedGames')
      .then((data) => {
        if (!Array.isArray(data)) return onFail()
        setGames(data as RecentlyPlayedGame[])
        setIsLoading(false)
        attemptRef.current = 0
      })
      .catch(onFail)
  }, [status, rausername])

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !rausername)) {
      hasFetched.current = false
      clearTimeout(retryTimer.current)
      attemptRef.current = 0
      setGames([])
      setIsLoading(false)
      return
    }
    if (status !== 'authenticated' || !rausername || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [status, rausername, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setGames([])
    doFetch()
  }, [doFetch])

  return <Ctx.Provider value={{ games, isLoading, error, refetch }}>{children}</Ctx.Provider>
}

export const useRecentlyPlayedGames = () => useContext(Ctx)
