import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnSummary } from '@/lib/psnClient'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { fetchShared } from '@/lib/fetchShared'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import type { TrophyCounts } from '@/types/psn'

const NO_TROPHIES: TrophyCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 }

/** The linked PSN account's headline numbers: avatar, level, trophies by grade, games. */
export function usePsnSummary() {
  const { data: session } = useSession()
  const subject = useSubject()
  const accountId = session?.user?.psnaccountid ?? null
  const { library, libraryLoading } = usePsnGamesData()

  const [summary, setSummary] = useState<PsnSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PsnError | null>(null)
  const hasFetched = useRef<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchShared(withSubject('/api/psn/summary', subject))
      if (!res.ok) {
        setError(await psnErrorFrom(res))
        return
      }
      setSummary((await res.json()) as PsnSummary)
    } catch (err) {
      console.error('[usePsnSummary]', err)
      setError('failed')
    } finally {
      setIsLoading(false)
    }
  }, [subject])

  useEffect(() => {
    if (!accountId) {
      hasFetched.current = null
      return
    }
    if (hasFetched.current === accountId) return
    hasFetched.current = accountId
    load()
  }, [accountId, load])

  const visibleSummary = useMemo(() => {
    if (!summary || libraryLoading) return null
    const earned = library.reduce<TrophyCounts>((total, game) => ({
      bronze: total.bronze + game.earned.bronze,
      silver: total.silver + game.earned.silver,
      gold: total.gold + game.earned.gold,
      platinum: total.platinum + game.earned.platinum,
    }), { ...NO_TROPHIES })
    return { ...summary, games: library.length, earned }
  }, [summary, library, libraryLoading])

  // Profile identity stays; game-derived totals follow the visible library.
  return {
    summary: accountId ? visibleSummary : null,
    isLoading: isLoading || libraryLoading,
    error: accountId ? error : null,
    retry: load,
  }
}
