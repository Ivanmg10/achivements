'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentlyPlayedGame } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

type CtxType = {
  games: RecentlyPlayedGame[]
  isLoading: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({ games: [], isLoading: true, refetch: () => {} })

export function RecentlyPlayedGamesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated') return
    setIsLoading(true)
    fetchWithRetry('/api/getRecentlyPlayedGames')
      .then((data) => {
        if (!Array.isArray(data)) {
          const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
          attemptRef.current++
          retryTimer.current = setTimeout(doFetch, delay)
          return
        }
        setGames(data as RecentlyPlayedGame[])
        setIsLoading(false)
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
      setIsLoading(false)
      return
    }
    if (status !== 'authenticated' || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setGames([])
    doFetch()
  }, [doFetch])

  return <Ctx.Provider value={{ games, isLoading, refetch }}>{children}</Ctx.Provider>
}

export const useRecentlyPlayedGames = () => useContext(Ctx)
