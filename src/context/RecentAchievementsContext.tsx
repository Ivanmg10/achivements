'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RecentAchievement } from '@/types/types'
import { useSession } from 'next-auth/react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { withSubject } from '@/utils/withSubject'

type CtxType = {
  achievements: RecentAchievement[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

type ProviderValue = CtxType & { request: () => void }

const Ctx = createContext<ProviderValue>({ achievements: [], isLoading: true, error: false, refetch: () => {}, request: () => {} })

/**
 * The latest unlocks, shared by the home page and the account page. Loaded on
 * first use rather than on every route: a game or status page never reads it,
 * and should not wait on RA for it.
 */
export function RecentAchievementsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const subject = useSubject()
  const [wanted, setWanted] = useState(false)
  const request = useCallback(() => setWanted(true), [])
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    // Named, so a retry can call it again.
    const run = () => {
      if (!session?.user?.rausername) return
      const onFail = (err?: unknown) => {
        if (!scheduleRetry(attemptRef, retryTimer, run, err)) { setError(true); setIsLoading(false) }
      }
      fetchWithRetry(withSubject('/api/getRecentAchievements', subject))
        .then((data) => {
          if (!Array.isArray(data)) return onFail()
          setAchievements([...data].sort(
            (a, b) => new Date(b.Date.replace(' ', 'T')).getTime() - new Date(a.Date.replace(' ', 'T')).getTime()
          ))
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [session?.user?.rausername, subject])

  const signedOut = status === 'unauthenticated'
  const rausername = session?.user?.rausername

  // Starting over is state, so it happens while rendering; the refs and the fetch stay in the effect.
  useWhenChanged([signedOut, rausername], () => {
    if (signedOut) {
      setAchievements([])
      setIsLoading(false)
    } else if (!rausername) {
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
    if (!rausername || !wanted || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [rausername, signedOut, doFetch, wanted])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setAchievements([])
    setIsLoading(true)
    setError(false)
    doFetch()
  }, [doFetch])

  return <Ctx.Provider value={{ achievements, isLoading, error, refetch, request }}>{children}</Ctx.Provider>
}

/** Reading the list is what asks for it: the first reader starts the load. */
export function useRecentAchievements(): CtxType {
  const { request, ...value } = useContext(Ctx)
  useEffect(request, [request])
  return value
}
