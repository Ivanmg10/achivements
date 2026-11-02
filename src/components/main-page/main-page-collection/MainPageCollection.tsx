'use client'

import { useMemo } from 'react'
import type { RetroAchievementsGameCompleted, UserAwards } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { XboxGameProgress } from '@/types/xbox'
import { usePerfectGamesOrder } from '@/hooks/usePerfectGamesOrder'
import { applyPerfectOrder, buildPerfectGames, countPerfectGames, latestPerfects, perfectDates } from '@/utils/perfectGames'
import { ChartCard } from '@/components/ui/ChartCard'
import CollectionShelf from './collection-shelf/CollectionShelf'
import CollectionGrid from './collection-grid/CollectionGrid'
import CollectionNumbers from './collection-numbers/CollectionNumbers'
import CollectionClosest from './collection-closest/CollectionClosest'
import { RememberedHeight } from '@/components/ui/RememberedHeight'
import MainPageCollectionSkeleton from './main-page-collection-skeleton/MainPageCollectionSkeleton'

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
  xboxGames = [],
  awards,
  inProgress = [],
  isLoading,
}: {
  games: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
  psnGames?: PsnGameProgress[]
  xboxGames?: XboxGameProgress[]
  awards: UserAwards | null
  inProgress?: RetroAchievementsGameCompleted[]
  isLoading?: boolean
}) {
  const { order, saveOrder } = usePerfectGamesOrder()
  const raw = useMemo(() => buildPerfectGames(games, steamGames, psnGames, xboxGames), [games, steamGames, psnGames, xboxGames])
  const ordered = useMemo(() => applyPerfectOrder(raw, order), [raw, order])
  const counts = useMemo(() => countPerfectGames(raw), [raw])
  const dates = useMemo(() => perfectDates(awards?.VisibleUserAwards, steamGames, psnGames, xboxGames), [awards, steamGames, psnGames, xboxGames])
  const latest = useMemo(
    () => latestPerfects(awards?.VisibleUserAwards, steamGames, SHELF, psnGames, xboxGames),
    [awards, steamGames, psnGames, xboxGames],
  )

  if (isLoading) {
    return (
      <RememberedHeight id="collection" loading>
        <MainPageCollectionSkeleton />
      </RememberedHeight>
    )
  }

  return (
    <RememberedHeight id="collection" loading={false} className="flex flex-col gap-4">
      <ChartCard>
        <CollectionShelf games={latest} counts={counts} />
      </ChartCard>
      {/* The numbers as a strip across: stacked beside the collection they ran far taller than it. */}
      <ChartCard>
        <CollectionNumbers awards={awards} steamGames={steamGames} psnGames={psnGames} xboxGames={xboxGames} />
      </ChartCard>
      {/* What could join the collection next, beside it; with nothing near 100% the collection takes the row. */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard className="xl:col-span-2 xl:last:col-span-3">
          <CollectionGrid games={ordered} allGames={raw} dates={dates} order={order} onSaveOrder={saveOrder} />
        </ChartCard>
        <CollectionClosest inProgress={inProgress} steamGames={steamGames} psnGames={psnGames} xboxGames={xboxGames} />
      </div>
    </RememberedHeight>
  )
}
