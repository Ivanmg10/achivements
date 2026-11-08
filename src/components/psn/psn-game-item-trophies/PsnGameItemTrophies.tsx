'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import { Skeleton } from '@/components/ui/Skeleton'
import ErrorRetry from '@/components/ui/ErrorRetry'

const SKELETON_BADGES = 12

/**
 * A PSN game's trophies inside an expanded card, fetched when this mounts —
 * i.e. when the card is opened — not for every game in a list. Shown as a
 * badge grid, like SteamGameItemAchievements.
 */
export default function PsnGameItemTrophies({
  gameId,
  titleId,
  gameTitle,
  expectedCount,
  badgeSize = 48,
  limit,
}: {
  gameId: number
  titleId: string
  /** For the pinned card. */
  gameTitle: string
  /** Known trophy count, so the loading skeleton has the right size. */
  expectedCount?: number
  badgeSize?: 40 | 48
  limit?: number
}) {
  const { T } = useLanguage()
  const { trophies, groups, isLoading, error, retry } = usePsnTrophies(titleId)

  if (isLoading) {
    const badge = badgeSize === 40 ? 'w-10 h-10' : 'w-12 h-12'
    return (
      <ul aria-busy="true" className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(expectedCount || SKELETON_BADGES, 60) }).map((_, i) => (
          <li key={i}><Skeleton radius="tile" className={badge} /></li>
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <ErrorRetry message={T.psn.trophiesError} hint={error === 'private' ? T.psn.errors.private : undefined} retryLabel={T.psn.retry} onRetry={retry} />
    )
  }

  if (trophies.length === 0) {
    return <p className="text-sm text-text-secondary text-center py-2">{T.psn.noTrophies}</p>
  }

  return <PsnTrophyGrid gameId={gameId} gameTitle={gameTitle} trophies={trophies} groups={groups} badgeSize={badgeSize} limit={limit} />
}
