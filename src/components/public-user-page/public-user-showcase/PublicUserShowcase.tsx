'use client'

import { useMemo } from 'react'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useUserAwards } from '@/hooks/useUserAwards'
import { buildPerfectGames, countPerfectGames, latestPerfects } from '@/utils/perfectGames'
import { ChartCard } from '@/components/ui/ChartCard'
import CollectionShelf from '@/components/main-page/main-page-collection/collection-shelf/CollectionShelf'
import MainPageFavorites from '@/components/main-page/main-page-favorites/MainPageFavorites'

const SHELF = 5

/**
 * What a user shows off: their latest games at 100% on the trophy shelf, and
 * the achievements they pinned. Both are the main page's own cards, read as
 * that user (and with nothing of theirs to change).
 */
export default function PublicUserShowcase() {
  const { all, isLoading: gamesLoading } = useGamesData()
  const { library: steam } = useSteamGamesData()
  const { library: psn } = usePsnGamesData()
  const { awards, isLoading: awardsLoading } = useUserAwards()

  const counts = useMemo(() => countPerfectGames(buildPerfectGames(all, steam, psn)), [all, steam, psn])
  const latest = useMemo(() => latestPerfects(awards?.VisibleUserAwards, steam, SHELF, psn), [awards, steam, psn])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
      <ChartCard className="xl:col-span-3">
        {gamesLoading || awardsLoading ? (
          <div aria-busy="true" className="h-60 rounded-xl bg-bg-main animate-pulse motion-reduce:animate-none" />
        ) : (
          <CollectionShelf games={latest} counts={counts} />
        )}
      </ChartCard>
      <ChartCard className="xl:col-span-2">
        <MainPageFavorites />
      </ChartCard>
    </div>
  )
}
