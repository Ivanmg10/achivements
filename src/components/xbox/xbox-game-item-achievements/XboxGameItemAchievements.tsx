'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { XboxAchievementGrid } from '@/components/xbox/xbox-achievement-grid/XboxAchievementGrid'
import { Skeleton } from '@/components/ui/Skeleton'
import ErrorRetry from '@/components/ui/ErrorRetry'

const SKELETON_BADGES = 12

/**
 * An Xbox game's achievements inside an expanded card, fetched when this
 * mounts — i.e. when the card is opened — not for every game in a list. Shown
 * as a badge grid, like PsnGameItemTrophies.
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
      <ErrorRetry
        message={T.xbox.achievementsError}
        hint={error === 'private' ? T.xbox.errors.private : undefined}
        retryLabel={T.xbox.retry}
        onRetry={retry}
      />
    )
  }

  if (achievements.length === 0) {
    return <p className="text-sm text-text-secondary text-center py-2">{T.xbox.noAchievements}</p>
  }

  return <XboxAchievementGrid gameId={gameId} gameTitle={gameTitle} achievements={achievements} badgeSize={badgeSize} limit={limit} />
}
