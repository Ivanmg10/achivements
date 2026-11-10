'use client'

import type { ReactNode } from 'react'
import type { InsightAchievement } from '@/utils/gameInsights'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'

const PANEL = 'bg-bg-main/55 ring-1 ring-ink/[0.06] rounded-control'

/**
 * An opened game in the recent feed, the pinned list and the PSN collections, for every platform: the
 * progress ring (with the platform's own facts under it) and the unlocks over time and a side panel on
 * top, the whole badge grid across the card below. The platform's expanded component says what its
 * game has (the totals, the facts, the grid, the side panel); this lays them out. On a phone the
 * panels stack, the ring beside its facts.
 */
export default function GameExpandedLayout({
  earned,
  total,
  ringLabel,
  ringExtra,
  gridTitle,
  unlocks,
  isLoading,
  side,
  children,
}: {
  earned: number
  total: number
  /** Under the number in the ring. */
  ringLabel: string
  /** Under the ring: the platform's grades, gamerscore, play time or points. */
  ringExtra: ReactNode
  /** The grid's heading. */
  gridTitle: string
  /** The game's unlocks, for the chart. */
  unlocks: InsightAchievement[]
  isLoading: boolean
  /** Beside the chart: the rarest earned, or the pinned achievements. */
  side: ReactNode
  /** The badge grid (or what stands in for it while it loads). */
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[190px_1.3fr_1fr] lg:grid-rows-[20rem_auto] gap-3 w-full">
      <div className={`${PANEL} p-4 lg:p-6 flex flex-row items-center gap-4 lg:flex-col lg:justify-center lg:h-full lg:col-start-1 lg:row-start-1`}>
        <CircularProgress earned={earned} total={total} label={ringLabel} size={130} />
        {ringExtra}
      </div>

      <div className={`${PANEL} p-3 lg:col-start-1 lg:col-span-3 lg:row-start-2`}>
        <p className="text-sm font-bold text-text-main mb-2.5">{gridTitle}</p>
        {children}
      </div>

      <div className={`${PANEL} p-3 lg:h-full lg:col-start-2 lg:row-start-1`}>
        <GameAchievementsProgressChart achievements={unlocks} isLoading={isLoading} />
      </div>

      <div className={`${PANEL} p-3 lg:h-full lg:col-start-3 lg:row-start-1`}>{side}</div>
    </div>
  )
}
