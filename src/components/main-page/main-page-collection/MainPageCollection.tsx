'use client'

import { useMemo } from 'react'
import type { RetroAchievementsGameCompleted, UserAwards } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import { usePerfectGamesOrder } from '@/hooks/usePerfectGamesOrder'
import { applyPerfectOrder, buildPerfectGames, countPerfectGames, latestPerfects, perfectDates } from '@/utils/perfectGames'
import { ChartCard } from '@/components/ui/ChartCard'
import CollectionShelf from './collection-shelf/CollectionShelf'
import CollectionGrid from './collection-grid/CollectionGrid'
import CollectionNumbers from './collection-numbers/CollectionNumbers'

/** Boxes on the shelf: enough to fill the card's width, few enough to read each one. */
const SHELF = 5

/**
 * The Collection section, as one trophy room with a single reading order:
 * the cabinet of the latest games at 100% across the top, then every game at
 * 100% (by year, or in the user's own order) beside the numbers behind them.
 * Each thing is shown once: what is newest lives in the cabinet only.
 */
export default function MainPageCollection({
  games,
  steamGames = [],
  psnGames = [],
  awards,
  inProgress = [],
  isLoading,
}: {
  games: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
  psnGames?: PsnGameProgress[]
  awards: UserAwards | null
  inProgress?: RetroAchievementsGameCompleted[]
  isLoading?: boolean
}) {
  const { order, saveOrder } = usePerfectGamesOrder()
  const raw = useMemo(() => buildPerfectGames(games, steamGames, psnGames), [games, steamGames, psnGames])
  const ordered = useMemo(() => applyPerfectOrder(raw, order), [raw, order])
  const counts = useMemo(() => countPerfectGames(raw), [raw])
  const dates = useMemo(() => perfectDates(awards?.VisibleUserAwards, steamGames, psnGames), [awards, steamGames, psnGames])
  const latest = useMemo(
    () => latestPerfects(awards?.VisibleUserAwards, steamGames, SHELF, psnGames),
    [awards, steamGames, psnGames],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse motion-reduce:animate-none" aria-busy="true">
        <div className="h-60 rounded-xl bg-bg-card" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="h-80 rounded-xl bg-bg-card xl:col-span-2" />
          <div className="h-80 rounded-xl bg-bg-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartCard>
        <CollectionShelf games={latest} counts={counts} />
      </ChartCard>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <ChartCard className="xl:col-span-2">
          <CollectionGrid games={ordered} allGames={raw} dates={dates} order={order} onSaveOrder={saveOrder} />
        </ChartCard>
        <ChartCard>
          <CollectionNumbers awards={awards} inProgress={inProgress} steamGames={steamGames} psnGames={psnGames} />
        </ChartCard>
      </div>
    </div>
  )
}
