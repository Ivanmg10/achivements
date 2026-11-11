'use client'

import type { PsnGameProgress, TrophyCounts } from '@/types/psn'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnCollectionTrophies } from '@/hooks/usePsnCollectionTrophies'
import { fromPsn } from '@/utils/gameInsights'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import PsnTrophyGridGroup from '@/components/psn/psn-trophy-grid/psn-trophy-grid-group/PsnTrophyGridGroup'
import PsnRarestTrophies from '@/components/psn/psn-rarest-trophies/PsnRarestTrophies'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'

const SKELETON_BADGES = 24
const NONE: TrophyCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 }

function sum(counts: TrophyCounts[]): TrophyCounts {
  return counts.reduce((a, c) => ({ bronze: a.bronze + c.bronze, silver: a.silver + c.silver, gold: a.gold + c.gold, platinum: a.platinum + c.platinum }), NONE)
}

/**
 * An opened collection in the recent feed, laid out like an opened game (PsnRecentlyPlayedExpanded): the
 * ring, chart and rarest count every game of the collection, and below each game is a fold with its
 * trophies, as a game's DLC are. Each game keeps its own page, pins and completion.
 */
export default function PsnCollectionExpanded({ games }: { games: PsnGameProgress[] }) {
  const { T } = useLanguage()
  const { byGame, isLoading, error, retry } = usePsnCollectionTrophies(games.map((g) => g.titleId))

  const all = games.flatMap((g) => (byGame[g.titleId]?.trophies ?? []).map((t) => ({ ...t, gameId: g.id })))
  const loaded = all.length > 0
  const total = loaded ? all.length : games.reduce((n, g) => n + g.maxPossible, 0)
  const earned = loaded ? all.filter((t) => t.earned).length : games.reduce((n, g) => n + g.numAwarded, 0)
  // Trophy ids repeat across the games, so each is keyed by its game too.
  const unlocks = games.flatMap((g) =>
    fromPsn(byGame[g.titleId]?.trophies ?? [], g.id).map((t) => ({ ...t, id: `${g.id}:${t.id}` })),
  )

  return (
    <GameExpandedLayout
      earned={earned}
      total={total}
      ringLabel={T.psn.trophies}
      ringExtra={<PsnTrophyCounts earned={sum(games.map((g) => g.earned))} of={sum(games.map((g) => g.defined))} className="flex-col items-start! lg:items-center!" />}
      gridTitle={T.psn.trophies}
      unlocks={unlocks}
      isLoading={isLoading}
      side={<PsnRarestTrophies gameId={games[0].id} trophies={all} isLoading={isLoading} />}
    >
      <LazyBadgeGrid
        loading={isLoading}
        count={total || SKELETON_BADGES}
        error={error ? { message: T.psn.trophiesError, hint: error === 'private' ? T.psn.errors.private : undefined, retryLabel: T.psn.retry, onRetry: retry } : null}
        empty={null}
      >
        {games.map((g) => {
          const { trophies = [], groups = [] } = byGame[g.titleId] ?? {}
          return (
            <PsnTrophyGridGroup key={g.id} name={g.title} earned={trophies.filter((t) => t.earned).length} total={trophies.length}>
              {trophies.length > 0 ? (
                <PsnTrophyGrid gameId={g.id} gameTitle={g.title} trophies={trophies} groups={groups} badgeSize={40} />
              ) : (
                <p className="text-sm text-text-secondary">{T.psn.noTrophies}</p>
              )}
            </PsnTrophyGridGroup>
          )
        })}
      </LazyBadgeGrid>
    </GameExpandedLayout>
  )
}
