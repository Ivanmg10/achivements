import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useGameProgression(gameId: string | null) {
  const { status } = useSession()
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fetchedGameId = useRef<string | null>(null)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(
    (id: string) => {
      if (status !== 'authenticated') return
      setIsLoading(true)
      fetch(`/api/getGameProgression?gameId=${id}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
        .then((data: RetroAchievementsGameWithAchievements) => {
          if (!data?.ID) {
            const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
            attemptRef.current++
            retryTimer.current = setTimeout(() => doFetch(id), delay)
            return
          }
          setGame(data)
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch(() => {
          const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
          attemptRef.current++
          retryTimer.current = setTimeout(() => doFetch(id), delay)
        })
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

  return { game, isLoading }
}
