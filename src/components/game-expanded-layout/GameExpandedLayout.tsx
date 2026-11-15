'use client'

import type { ReactNode } from 'react'
import type { InsightAchievement } from '@/utils/gameInsights'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'

const PANEL = 'bg-bg-main/55 ring-1 ring-ink/[0.06] rounded-control'
// Container widths: @md (28rem) puts the chart and the side panel side by side under the ring, @3xl (48rem) the three columns.
const GRID =
  'grid grid-cols-1 gap-3 @md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @md:grid-rows-[auto_20rem_auto] @3xl:grid-cols-[190px_minmax(0,1.3fr)_minmax(0,1fr)] @3xl:grid-rows-[20rem_auto]'

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
        <div className={`${PANEL} p-4 flex flex-row items-center gap-4 @md:col-span-2 @md:row-start-1 @3xl:col-span-1 @3xl:col-start-1 @3xl:p-6 @3xl:flex-col @3xl:justify-center @3xl:h-full`}>
          <CircularProgress earned={earned} total={total} label={ringLabel} size={130} />
          {ringExtra}
        </div>

        <div className={`${PANEL} p-3 @md:col-span-2 @md:row-start-3 @3xl:col-span-3 @3xl:row-start-2`}>
          <p className="text-sm font-bold text-text-main mb-2.5">{gridTitle}</p>
          {children}
        </div>

        <div className={`${PANEL} p-3 @md:h-full @md:row-start-2 @3xl:col-start-2 @3xl:row-start-1`}>
          <GameAchievementsProgressChart achievements={unlocks} isLoading={isLoading} />
        </div>

        <div className={`${PANEL} p-3 @md:h-full @md:row-start-2 @3xl:col-start-3 @3xl:row-start-1`}>{side}</div>
      </div>
    </div>
  )
}
