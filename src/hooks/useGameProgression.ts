import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'

export function useGameProgression(gameId: string | null) {
  const { status, data: session } = useAuthSession()
  const subject = useSubject()
  // Keyed by the RA account too: another one linked never paints the last one's answers.
  const user = session?.user?.id ? `${session.user.id}:${session.user.rausername ?? ''}` : undefined
  const urlOf = useCallback((id: string) => withSubject(`/api/getGameProgression?gameId=${id}`, subject), [subject])
  // Coming back to a page: the game as it showed, at once, while it is read again (lastAnswers).
  const shown = gameId ? lastAnswer<RetroAchievementsGameWithAchievements>(user, urlOf(gameId)) : undefined
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(() => shown ?? null)
  /** The game whose answer (the data, or the final failure) is in; loading is anything else being asked for. */
  const [loadedFor, setLoadedFor] = useState<string | null>(() => (shown ? gameId : null))
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
        fetch(urlOf(id))
          .then((r) => {
            // The status is what lets scheduleRetry give up at once on a 4xx.
            if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status })
            return r.json()
          })
          .then((data: RetroAchievementsGameWithAchievements) => {
            if (!data?.ID) return onFail()
            keepAnswer(user, urlOf(id), data)
            setGame(data)
            setFailed(false)
            setLoadedFor(id)
            attemptRef.current = 0
          })
          .catch(onFail)
      }
      run(id)
    },
    [status, urlOf, user],
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
