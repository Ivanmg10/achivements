'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { SteamAchievementGrid } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'

const SKELETON_BADGES = 12

/**
 * A Steam game's achievements inside an expanded card, fetched when this mounts, i.e. when the card is
 * opened, not for every game in a list.
 */
export default function SteamGameItemAchievements({
  appId,
  gameTitle,
  expectedCount,
  badgeSize = 48,
  limit,
}: {
  appId: number
  gameTitle: string
  /** Known achievement count, so the loading skeleton has the right size. */
  expectedCount?: number
  badgeSize?: 40 | 48
  limit?: number
}) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useSteamAchievements(appId)

  return (
    <LazyBadgeGrid
      loading={isLoading}
      count={expectedCount || SKELETON_BADGES}
      size={badgeSize}
      error={error ? { message: T.steam.achievementsError, hint: T.steam.privateProfileHint, retryLabel: T.steam.retry, onRetry: retry } : null}
      empty={achievements.length === 0 ? T.steam.noAchievements : null}
      centered
    >
      <SteamAchievementGrid appId={appId} gameTitle={gameTitle} achievements={achievements} badgeSize={badgeSize} limit={limit} />
    </LazyBadgeGrid>
  )
}
