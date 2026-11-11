'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { fromPsn } from '@/utils/gameInsights'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import PsnRarestTrophies from '@/components/psn/psn-rarest-trophies/PsnRarestTrophies'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import type { PsnGameProgress } from '@/types/psn'

const SKELETON_BADGES = 24

/**
 * An opened PSN game in the recent feed and the pinned list: the ring with the trophies by grade, the
 * chart and the rarest earned, the full grid below. Trophies load when this mounts, i.e. when the card
 * is opened; until then the ring uses the counts the list already has.
 */
export default function PsnRecentlyPlayedExpanded({ game }: { game: PsnGameProgress }) {
  const { T } = useLanguage()
  const { trophies, groups, isLoading, error, retry } = usePsnTrophies(game.titleId)

  const loaded = trophies.length > 0
  // The whole set, DLC included, as "completed" counts it.
  const total = loaded ? trophies.length : game.maxPossible
  const earned = loaded ? trophies.filter((t) => t.earned).length : game.numAwarded

  return (
    <GameExpandedLayout
      earned={earned}
      total={total}
      ringLabel={T.psn.trophies}
      ringExtra={<PsnTrophyCounts earned={game.earned} of={game.defined} className="flex-col items-start! lg:items-center!" />}
      gridTitle={T.psn.trophies}
      unlocks={fromPsn(trophies, game.id)}
      isLoading={isLoading}
      side={<PsnRarestTrophies gameId={game.id} trophies={trophies} isLoading={isLoading} />}
    >
      <LazyBadgeGrid
        loading={isLoading}
        count={total || SKELETON_BADGES}
        error={error ? { message: T.psn.trophiesError, hint: error === 'private' ? T.psn.errors.private : undefined, retryLabel: T.psn.retry, onRetry: retry } : null}
        empty={loaded ? null : T.psn.noTrophies}
      >
        <PsnTrophyGrid gameId={game.id} gameTitle={game.title} trophies={trophies} groups={groups} badgeSize={40} />
      </LazyBadgeGrid>
    </GameExpandedLayout>
  )
}
