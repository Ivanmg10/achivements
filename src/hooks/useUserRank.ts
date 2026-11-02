import { UserRankAndScore } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'

export function useUserRank() {
  const { data: session } = useSession()
  const subject = useSubject()
  const user = session?.user?.id
  const url = withSubject('/api/getUserRankAndScore', subject)
  // Coming back to a page: what it showed, at once, while it is read again (lastAnswers).
  const [rank, setRank] = useState<UserRankAndScore | null>(() => lastAnswer<UserRankAndScore>(user, url) ?? null)
  const [isLoading, setIsLoading] = useState(() => lastAnswer(user, url) === undefined)
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
      fetchWithRetry(url)
        .then((data) => {
          if (!data || typeof data !== 'object' || Array.isArray(data) || !('Rank' in data)) return onFail()
          keepAnswer(user, url, data)
          setRank(data as UserRankAndScore)
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [session?.user?.rausername, url, user])

  useEffect(() => {
    if (!session?.user?.rausername || hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [session?.user?.rausername, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setRank(null)
    setIsLoading(true)
    setError(false)
    doFetch()
  }, [doFetch])

  // Nobody to load for is not loading, whatever the last request left behind.
  return { rank, isLoading: Boolean(session?.user?.rausername) && isLoading, error, refetch }
}
