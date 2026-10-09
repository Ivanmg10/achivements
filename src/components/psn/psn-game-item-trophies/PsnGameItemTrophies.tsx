'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'

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
          <li key={i} className={`${badge} rounded-lg bg-bg-main animate-pulse`} />
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p role="alert" className="text-sm text-red-400">
          {T.psn.trophiesError}
        </p>
        {error === 'private' && <p className="text-xs text-text-secondary">{T.psn.errors.private}</p>}
        <button onClick={retry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
          {T.psn.retry}
        </button>
      </div>
    )
  }

  if (trophies.length === 0) {
    return <p className="text-sm text-text-secondary text-center py-2">{T.psn.noTrophies}</p>
  }

  return <PsnTrophyGrid gameId={gameId} gameTitle={gameTitle} trophies={trophies} groups={groups} badgeSize={badgeSize} limit={limit} />
}
