'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { SteamAchievementGrid } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'

const SKELETON_BADGES = 12

/**
 * A Steam game's achievements inside an expanded card, fetched when this
 * mounts — i.e. when the card is opened — not for every game in a list.
 * Shows them as a badge grid, like RA cards do.
 */
export default function SteamGameItemAchievements({
  appId,
  expectedCount,
  badgeSize = 48,
}: {
  appId: number
  /** Known achievement count, so the loading skeleton has the right size. */
  expectedCount?: number
  badgeSize?: 40 | 48
}) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useSteamAchievements(appId)

  if (isLoading) {
    const badge = badgeSize === 40 ? 'w-10 h-10' : 'w-12 h-12'
    return (
      <ul aria-busy="true" className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(expectedCount || SKELETON_BADGES, 60) }).map((_, i) => (
          <li key={i} className={`${badge} rounded-lg bg-bg-main animate-pulse`} />
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p role="alert" className="text-sm text-red-400">
          {T.steam.achievementsError}
        </p>
        <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
        <button
          onClick={retry}
          className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
        >
          {T.steam.retry}
        </button>
      </div>
    )
  }

  if (achievements.length === 0) {
    return <p className="text-sm text-text-secondary text-center py-2">{T.steam.noAchievements}</p>
  }

  return <SteamAchievementGrid appId={appId} achievements={achievements} badgeSize={badgeSize} />
}
