'use client'

import { ChartCard } from '@/components/ui/ChartCard'
import MainPagePinnedSectionAchievements from './main-page-pinned-section-achievements/MainPagePinnedSectionAchievements'
import MainPagePinnedSectionGames from './main-page-pinned-section-games/MainPagePinnedSectionGames'
import MainPagePinnedSectionShowcase from './main-page-pinned-section-showcase/MainPagePinnedSectionShowcase'

/**
 * Stats & Activity's Pinned section: the achievement showcase (what others see),
 * then the achievements to get (the user's own goals) and the pinned games.
 */
export default function MainPagePinnedSection() {
  return (
    <>
      <ChartCard className="h-auto!">
        <MainPagePinnedSectionShowcase />
      </ChartCard>
      <ChartCard>
        <MainPagePinnedSectionAchievements />
      </ChartCard>
      <ChartCard>
        <MainPagePinnedSectionGames />
      </ChartCard>
    </>
  )
}
