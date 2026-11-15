import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { xboxErrorFrom, type XboxLinkError } from '@/hooks/useXboxLink'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { usePlatformRead } from '@/hooks/usePlatformRead'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import type { XboxSummary } from '@/types/xbox'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'

const SPEC = { tag: 'useXboxSummary', errorFrom: xboxErrorFrom }

/** The linked Xbox account's headline numbers: avatar, gamerscore, achievements unlocked, games. */
export function useXboxSummary() {
  const { data: session } = useSession()
  const enabled = useXboxEnabled()
  const subject = useSubject()
  const xuid = enabled ? (session?.user?.xboxxuid ?? null) : null
  const { library, libraryLoading } = useXboxGamesData()
  const { data: summary, error, isLoading, retry } = usePlatformRead<XboxSummary, XboxLinkError>(
    xuid ? withSubject('/api/xbox/summary', subject) : null,
    SPEC,
  )

  const visibleSummary = useMemo(() => summary && !libraryLoading ? {
    ...summary,
    games: library.length,
    gamerscore: library.reduce((total, game) => total + game.earnedGamerscore, 0),
    achievementsUnlocked: library.reduce((total, game) => total + game.numAwarded, 0),
  } : null, [summary, library, libraryLoading])

  // Profile identity stays; game-derived totals follow the visible library.
  return { summary: visibleSummary, isLoading: isLoading || libraryLoading, error, retry }
}
