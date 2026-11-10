'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'

const SKELETON_BADGES = 12

/**
 * A PSN game's trophies inside an expanded card, fetched when this mounts, i.e. when the card is
 * opened, not for every game in a list.
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

  return (
    <LazyBadgeGrid
      loading={isLoading}
      count={expectedCount || SKELETON_BADGES}
      size={badgeSize}
      error={error ? { message: T.psn.trophiesError, hint: error === 'private' ? T.psn.errors.private : undefined, retryLabel: T.psn.retry, onRetry: retry } : null}
      empty={trophies.length === 0 ? T.psn.noTrophies : null}
      centered
    >
      <PsnTrophyGrid gameId={gameId} gameTitle={gameTitle} trophies={trophies} groups={groups} badgeSize={badgeSize} limit={limit} />
    </LazyBadgeGrid>
  )
}
