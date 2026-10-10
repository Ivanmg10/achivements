'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentlyPlayedGame } from '@/types/types'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { withSubject } from '@/utils/withSubject'

type CtxType = {
  games: RecentlyPlayedGame[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({ games: [], isLoading: true, error: false, refetch: () => {} })

export function RecentlyPlayedGamesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const subject = useSubject()
  // No RetroAchievements account means nothing to ask for.
  const rausername = session?.user?.rausername
  const [games, setGames] = useState<RecentlyPlayedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    // Named, so a retry can call it again.
    const run = () => {
      if (status !== 'authenticated' || !rausername) return
      const onFail = (err?: unknown) => {
        if (!scheduleRetry(attemptRef, retryTimer, run, err)) { setError(true); setIsLoading(false) }
      }
      fetchWithRetry(withSubject('/api/getRecentlyPlayedGames', subject))
        .then((data) => {
          if (!Array.isArray(data)) return onFail()
          setGames(data as RecentlyPlayedGame[])
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [status, rausername, subject])

  const signedOut = status === 'unauthenticated' || (status === 'authenticated' && !rausername)
  const canFetch = status === 'authenticated' && Boolean(rausername)

  // Starting over is state, so it happens while rendering; the refs and the fetch stay in the effect.
  // Keyed on signedOut alone: session.update() makes status flip to 'loading' and back, and that
  // must not start a load the effect (it fetches once per sign-in) will never answer.
  useWhenChanged([signedOut], () => {
    if (signedOut) {
      setGames([])
      setIsLoading(false)
    } else {
      setIsLoading(true)
      setError(false)
    }
  })

  useEffect(() => {
    if (signedOut) {
      hasFetched.current = false
      clearTimeout(retryTimer.current)
      attemptRef.current = 0
      return
    }
    if (!canFetch || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [signedOut, canFetch, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setGames([])
    setIsLoading(true)
    setError(false)
    doFetch()
  }, [doFetch])

  return <Ctx.Provider value={{ games, isLoading, error, refetch }}>{children}</Ctx.Provider>
}

export const useRecentlyPlayedGames = () => useContext(Ctx)
