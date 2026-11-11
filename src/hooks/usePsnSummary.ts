import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import { usePlatformRead } from '@/hooks/usePlatformRead'
import type { PsnSummary } from '@/lib/psnClient'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import type { TrophyCounts } from '@/types/psn'

const NO_TROPHIES: TrophyCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
const SPEC = { tag: 'usePsnSummary', errorFrom: psnErrorFrom }

/** The linked PSN account's headline numbers: avatar, level, trophies by grade, games. */
export function usePsnSummary() {
  const { data: session } = useSession()
  const subject = useSubject()
  const accountId = session?.user?.psnaccountid ?? null
  const { library, libraryLoading } = usePsnGamesData()
  const { data: summary, error, isLoading, retry } = usePlatformRead<PsnSummary, PsnError>(
    accountId ? withSubject('/api/psn/summary', subject) : null,
    SPEC,
  )

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
  return { summary: visibleSummary, isLoading: isLoading || libraryLoading, error, retry }
}
