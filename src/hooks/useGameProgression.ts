import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scheduleRetry } from '@/lib/fetchWithRetry'

export function useGameProgression(gameId: string | null) {
  const { status } = useSession()
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const fetchedGameId = useRef<string | null>(null)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(
    (id: string) => {
      if (status !== 'authenticated') return
      setIsLoading(true)
      setError(false)
      const onFail = (err?: unknown) => {
        if (!scheduleRetry(attemptRef, retryTimer, () => doFetch(id), err)) { setError(true); setIsLoading(false) }
      }
      fetch(`/api/getGameProgression?gameId=${id}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
        .then((data: RetroAchievementsGameWithAchievements) => {
          if (!data?.ID) return onFail()
          setGame(data)
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    },
    [status],
  )

  useEffect(() => {
    if (status === 'unauthenticated') {
      fetchedGameId.current = null
      clearTimeout(retryTimer.current)
      attemptRef.current = 0
      setGame(null)
      setIsLoading(false)
      return
    }
    if (!gameId || status !== 'authenticated' || fetchedGameId.current === gameId) return
    fetchedGameId.current = gameId
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    doFetch(gameId)
  }, [gameId, status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    if (!gameId) return
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    doFetch(gameId)
  }, [gameId, doFetch])

  return { game, isLoading, error, refetch }
}
