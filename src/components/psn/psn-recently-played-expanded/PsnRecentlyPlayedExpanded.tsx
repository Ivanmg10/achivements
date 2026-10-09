'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import PsnRarestTrophies from '@/components/psn/psn-rarest-trophies/PsnRarestTrophies'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import { BASE_GROUP } from '@/utils/psnTitles'
import type { PsnGameProgress } from '@/types/psn'

const SKELETON_BADGES = 24

/**
 * An expanded PSN game in the recent feed and the pinned list, laid out
 * exactly like Steam's: progress ring (with the trophies by grade), the
 * trophies-over-time chart and the rarest earned on top, the full badge grid
 * across the card below. Trophies load when this mounts, i.e. when the card is
 * opened; until then the ring uses the counts the list already has.
 */
export default function PsnRecentlyPlayedExpanded({ game }: { game: PsnGameProgress }) {
  const { T } = useLanguage()
  const { trophies, groups, isLoading, error, retry } = usePsnTrophies(game.titleId)

  const loaded = trophies.length > 0
  // The ring goes by the base game, as "completed" does; DLC shows in the grid below it.
  const base = groups.length > 1 ? trophies.filter((t) => t.groupId === BASE_GROUP) : trophies
  const total = loaded ? base.length : game.maxPossible
  const earned = loaded ? base.filter((t) => t.earned).length : game.numAwarded

  // The chart only reads earn dates; PSN has no hardcore.
  const unlocks = trophies.map((t) => ({ DateEarned: t.earnedAt, DateEarnedHardcore: null }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[190px_1.3fr_1fr] lg:grid-rows-[20rem_auto] gap-3 w-full">
      <div className="bg-bg-header/40 rounded-xl p-4 lg:p-6 flex flex-row items-center gap-4 lg:flex-col lg:justify-center lg:h-full lg:col-start-1 lg:row-start-1">
        <CircularProgress earned={earned} total={total} label={T.psn.trophies} size={130} />
        <PsnTrophyCounts earned={game.earned} of={game.defined} className="flex-col items-start! lg:items-center!" />
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
        ) : loaded ? (
          <PsnTrophyGrid gameId={game.id} gameTitle={game.title} trophies={trophies} groups={groups} badgeSize={40} />
        ) : (
          <p className="text-sm text-text-secondary">{T.psn.noTrophies}</p>
        )}
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-2 lg:row-start-1">
        <GameAchievementsProgressChart achievements={unlocks} isLoading={isLoading} />
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-3 lg:row-start-1">
        <PsnRarestTrophies gameId={game.id} trophies={trophies} isLoading={isLoading} />
      </div>
    </div>
  )
}
