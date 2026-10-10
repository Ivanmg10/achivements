import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useWhenChanged } from '@/hooks/useWhenChanged'

export function useGameProgression(gameId: string | null) {
  const { status } = useSession()
  const subject = useSubject()
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(null)
  /** The game whose answer (the data, or the final failure) is in; loading is anything else being asked for. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const fetchedGameId = useRef<string | null>(null)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const wanted = status === 'authenticated' ? gameId : null
  const signedOut = status === 'unauthenticated'

  // Signing out drops the game; state, so while rendering. The refs are reset in the effect.
  useWhenChanged([signedOut], () => {
    if (signedOut) {
      setGame(null)
      setLoadedFor(null)
      setFailed(false)
    }
  })

  const doFetch = useCallback(
    (id: string) => {
      // Named, so a retry can call it again.
      const run = (id: string) => {
        if (status !== 'authenticated') return
        const onFail = (err?: unknown) => {
          if (!scheduleRetry(attemptRef, retryTimer, () => run(id), err)) { setFailed(true); setLoadedFor(id) }
        }
        fetch(withSubject(`/api/getGameProgression?gameId=${id}`, subject))
          .then((r) => {
            // The status is what lets scheduleRetry give up at once on a 4xx.
            if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status })
            return r.json()
          })
          .then((data: RetroAchievementsGameWithAchievements) => {
            if (!data?.ID) return onFail()
            setGame(data)
            setFailed(false)
            setLoadedFor(id)
            attemptRef.current = 0
          })
          .catch(onFail)
      }
      run(id)
    },
    [status, subject],
  )

  useEffect(() => {
    if (signedOut) {
      fetchedGameId.current = null
      clearTimeout(retryTimer.current)
      attemptRef.current = 0
      return
    }
    if (!wanted || fetchedGameId.current === wanted) return
    fetchedGameId.current = wanted
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    doFetch(wanted)
  }, [wanted, signedOut, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    if (!gameId) return
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setFailed(false)
    setLoadedFor(null)
    doFetch(gameId)
  }, [gameId, doFetch])

  const answered = wanted !== null && loadedFor === wanted
  return { game, isLoading: wanted !== null && !answered, error: answered && failed, refetch }
}
