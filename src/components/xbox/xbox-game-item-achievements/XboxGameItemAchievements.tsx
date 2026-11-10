'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { XboxAchievementGrid } from '@/components/xbox/xbox-achievement-grid/XboxAchievementGrid'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'

const SKELETON_BADGES = 12

/**
 * An Xbox game's achievements inside an expanded card, fetched when this mounts, i.e. when the card is
 * opened, not for every game in a list.
 */
export default function XboxGameItemAchievements({
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
  /** Known achievement count, so the loading skeleton has the right size. */
  expectedCount?: number
  badgeSize?: 40 | 48
  limit?: number
}) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useXboxAchievements(titleId)

  return (
    <LazyBadgeGrid
      loading={isLoading}
      count={expectedCount || SKELETON_BADGES}
      size={badgeSize}
      error={error ? { message: T.xbox.achievementsError, hint: error === 'private' ? T.xbox.errors.private : undefined, retryLabel: T.xbox.retry, onRetry: retry } : null}
      empty={achievements.length === 0 ? T.xbox.noAchievements : null}
      centered
    >
      <XboxAchievementGrid gameId={gameId} gameTitle={gameTitle} achievements={achievements} badgeSize={badgeSize} limit={limit} />
    </LazyBadgeGrid>
  )
}
