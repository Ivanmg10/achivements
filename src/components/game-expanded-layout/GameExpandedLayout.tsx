'use client'

import type { ReactNode } from 'react'
import type { InsightAchievement } from '@/utils/gameInsights'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'

const PANEL = 'bg-bg-main/55 ring-1 ring-ink/[0.06] rounded-control'
// Container widths: 28rem puts the chart and the side panel side by side under the ring, 46rem the three columns.
const GRID =
  'grid grid-cols-1 gap-3 @min-[28rem]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @min-[28rem]:grid-rows-[auto_20rem_auto] @min-[46rem]:grid-cols-[190px_minmax(0,1.3fr)_minmax(0,1fr)] @min-[46rem]:grid-rows-[20rem_auto]'

/**
 * An opened game in the recent feed, the pinned list and the PSN collections, for every platform: the
 * progress ring (with the platform's own facts under it) and the unlocks over time and a side panel on
 * top, the whole badge grid across the card below. The platform's expanded component says what its
 * game has (the totals, the facts, the grid, the side panel); this lays them out by the card's own width, not the
 * screen's (it opens in the home's column and in the landing's half): wide, three columns; narrower, the ring across the
 * top beside its facts, the chart and the side panel under it; narrowest (a phone), every panel stacked.
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
    <div className="@container w-full">
      <div className={GRID}>
        <div className={`${PANEL} p-4 flex flex-row items-center gap-4 @min-[28rem]:col-span-2 @min-[28rem]:row-start-1 @min-[46rem]:col-span-1 @min-[46rem]:col-start-1 @min-[46rem]:p-6 @min-[46rem]:flex-col @min-[46rem]:justify-center @min-[46rem]:h-full`}>
          <CircularProgress earned={earned} total={total} label={ringLabel} size={130} />
          {ringExtra}
        </div>

        <div className={`${PANEL} p-3 @min-[28rem]:col-span-2 @min-[28rem]:row-start-3 @min-[46rem]:col-span-3 @min-[46rem]:row-start-2`}>
          <p className="text-sm font-bold text-text-main mb-2.5">{gridTitle}</p>
          {children}
        </div>

        <div className={`${PANEL} p-3 @min-[28rem]:h-full @min-[28rem]:row-start-2 @min-[46rem]:col-start-2 @min-[46rem]:row-start-1`}>
          <GameAchievementsProgressChart achievements={unlocks} isLoading={isLoading} />
        </div>

        <div className={`${PANEL} p-3 @min-[28rem]:h-full @min-[28rem]:row-start-2 @min-[46rem]:col-start-3 @min-[46rem]:row-start-1`}>{side}</div>
      </div>
    </div>
  )
}
