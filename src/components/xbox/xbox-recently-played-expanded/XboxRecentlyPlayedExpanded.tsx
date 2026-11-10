'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { fromXbox } from '@/utils/gameInsights'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'
import { XboxAchievementGrid } from '@/components/xbox/xbox-achievement-grid/XboxAchievementGrid'
import XboxRarestAchievements from '@/components/xbox/xbox-rarest-achievements/XboxRarestAchievements'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import XboxPartialListNote from '@/components/xbox/xbox-partial-list-note/XboxPartialListNote'
import type { XboxGameProgress } from '@/types/xbox'

const SKELETON_BADGES = 24

/**
 * An opened Xbox game in the recent feed and the pinned list: the ring with the gamerscore, the chart
 * and the rarest earned, the full grid below. Achievements load when this mounts, i.e. when the card is
 * opened; until then the ring uses the counts the list already has. Xbox 360 lists only what was
 * unlocked, and the note under the grid says when the list is short.
 */
export default function XboxRecentlyPlayedExpanded({ game }: { game: XboxGameProgress }) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useXboxAchievements(game.titleId)

  const loaded = achievements.length > 0
  // The list can lack a total, and Xbox 360 lists only what was unlocked: the game's own total wins.
  const total = loaded && !game.totalKnown ? achievements.length : Math.max(game.maxPossible, achievements.length)
  const earned = loaded ? achievements.filter((a) => a.unlocked).length : game.numAwarded

  return (
    <GameExpandedLayout
      earned={earned}
      total={total}
      ringLabel={T.xbox.achievements}
      ringExtra={<XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="text-sm" />}
      gridTitle={T.xbox.achievements}
      unlocks={fromXbox(achievements, game.id)}
      isLoading={isLoading}
      side={<XboxRarestAchievements gameId={game.id} achievements={achievements} isLoading={isLoading} />}
    >
      <LazyBadgeGrid
        loading={isLoading}
        count={total || SKELETON_BADGES}
        error={error ? { message: T.xbox.achievementsError, hint: error === 'private' ? T.xbox.errors.private : undefined, retryLabel: T.xbox.retry, onRetry: retry } : null}
        empty={loaded ? null : T.xbox.noAchievements}
      >
        <XboxAchievementGrid gameId={game.id} gameTitle={game.title} achievements={achievements} badgeSize={40} />
        <XboxPartialListNote game={game} listed={achievements.length} />
      </LazyBadgeGrid>
    </GameExpandedLayout>
  )
}
