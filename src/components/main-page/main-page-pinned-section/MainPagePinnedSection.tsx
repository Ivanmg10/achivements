'use client'

import { ChartCard } from '@/components/ui/ChartCard'
import MainPagePinnedSectionAchievements from './main-page-pinned-section-achievements/MainPagePinnedSectionAchievements'
import MainPagePinnedSectionGames from './main-page-pinned-section-games/MainPagePinnedSectionGames'

/** Stats & Activity's Pinned section: the pinned achievements first and large, the pinned games under them. */
export default function MainPagePinnedSection() {
  return (
    <>
      <ChartCard>
        <MainPagePinnedSectionAchievements />
      </ChartCard>
      <ChartCard>
        <MainPagePinnedSectionGames />
      </ChartCard>
    </>
  )
}
