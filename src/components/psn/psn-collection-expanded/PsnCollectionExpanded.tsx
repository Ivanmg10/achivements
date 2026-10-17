'use client'

import type { PsnGameProgress, TrophyCounts } from '@/types/psn'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnCollectionTrophies } from '@/hooks/usePsnCollectionTrophies'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'
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
 * An opened collection in the recent feed, laid out like an opened game
 * (PsnRecentlyPlayedExpanded): the ring, chart and rarest count every game of
 * the collection, and below each game is a fold with its trophies, as a game's
 * DLC are. Each game keeps its own page, pins and completion.
 */
export default function PsnCollectionExpanded({ games }: { games: PsnGameProgress[] }) {
  const { T } = useLanguage()
  const { byGame, isLoading, error, retry } = usePsnCollectionTrophies(games.map((g) => g.titleId))

  const all = games.flatMap((g) => (byGame[g.titleId]?.trophies ?? []).map((t) => ({ ...t, gameId: g.id })))
  const loaded = all.length > 0
  const total = loaded ? all.length : games.reduce((n, g) => n + g.maxPossible, 0)
  const earned = loaded ? all.filter((t) => t.earned).length : games.reduce((n, g) => n + g.numAwarded, 0)
  const unlocks = all.map((t) => ({ DateEarned: t.earnedAt, DateEarnedHardcore: null }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[190px_1.3fr_1fr] lg:grid-rows-[20rem_auto] gap-3 w-full">
      <div className="bg-bg-header/40 rounded-xl p-4 lg:p-6 flex flex-row items-center gap-4 lg:flex-col lg:justify-center lg:h-full lg:col-start-1 lg:row-start-1">
        <CircularProgress earned={earned} total={total} label={T.psn.trophies} size={130} />
        <PsnTrophyCounts earned={sum(games.map((g) => g.earned))} of={sum(games.map((g) => g.defined))} className="flex-col items-start! lg:items-center!" />
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:col-start-1 lg:col-span-3 lg:row-start-2">
        <p className="text-xs text-text-secondary mb-2">{T.psn.trophies}</p>
        {isLoading ? (
          <ul aria-busy="true" className="flex flex-wrap gap-1">
            {Array.from({ length: Math.min(total || SKELETON_BADGES, 60) }).map((_, i) => (
              <li key={i} className="w-10 h-10 rounded-lg bg-ink/10 animate-pulse" />
            ))}
          </ul>
        ) : error ? (
          <div className="flex flex-col items-start gap-2">
            <p role="alert" className="text-sm text-red-400">
              {T.psn.trophiesError}
            </p>
            {error === 'private' && <p className="text-xs text-text-secondary">{T.psn.errors.private}</p>}
            <button onClick={retry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
              {T.psn.retry}
            </button>
          </div>
        ) : (
          games.map((g) => {
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
          })
        )}
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-2 lg:row-start-1">
        <GameAchievementsProgressChart achievements={unlocks} isLoading={isLoading} />
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-3 lg:row-start-1">
        <PsnRarestTrophies gameId={games[0].id} trophies={all} isLoading={isLoading} />
      </div>
    </div>
  )
}
