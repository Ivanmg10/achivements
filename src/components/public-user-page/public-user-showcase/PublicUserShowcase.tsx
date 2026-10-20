'use client'

import { useMemo } from 'react'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useUserAwards } from '@/hooks/useUserAwards'
import { buildPerfectGames, countPerfectGames, latestPerfects } from '@/utils/perfectGames'
import { ChartCard } from '@/components/ui/ChartCard'
import CollectionShelf from '@/components/main-page/main-page-collection/collection-shelf/CollectionShelf'
import PublicUserAchievementShowcase from '../public-user-achievement-showcase/PublicUserAchievementShowcase'

const SHELF = 5

/**
 * What a user shows off: their latest games at 100% on the trophy shelf (the
 * main page's own card, read as that user) and their achievement showcase.
 * Their pinned achievements are their own goals and are not shown here.
 */
export default function PublicUserShowcase() {
  const { all, isLoading: gamesLoading } = useGamesData()
  const { library: steam } = useSteamGamesData()
  const { library: psn } = usePsnGamesData()
  const { library: xbox } = useXboxGamesData()
  const { awards, isLoading: awardsLoading } = useUserAwards()

  const counts = useMemo(() => countPerfectGames(buildPerfectGames(all, steam, psn, xbox)), [all, steam, psn, xbox])
  const latest = useMemo(() => latestPerfects(awards?.VisibleUserAwards, steam, SHELF, psn, xbox), [awards, steam, psn, xbox])

  return (
    <div className="flex flex-col gap-4">
      <ChartCard>
        {gamesLoading || awardsLoading ? (
          <div aria-busy="true" className="h-60 rounded-xl bg-bg-main animate-pulse motion-reduce:animate-none" />
        ) : (
          <CollectionShelf games={latest} counts={counts} />
        )}
      </ChartCard>
      <ChartCard>
        <PublicUserAchievementShowcase />
      </ChartCard>
    </div>
  )
}
