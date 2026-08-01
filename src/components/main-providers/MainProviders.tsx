'use client'

import { RecentAchievementsProvider } from '@/context/RecentAchievementsContext'
import { GamesDataProvider } from '@/context/GamesDataContext'
import { MainViewProvider } from '@/context/MainViewContext'
import { PinnedGamesProvider } from '@/context/PinnedGamesContext'

export function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <MainViewProvider>
      <RecentAchievementsProvider>
        <GamesDataProvider>
          <PinnedGamesProvider>
            {children}
          </PinnedGamesProvider>
        </GamesDataProvider>
      </RecentAchievementsProvider>
    </MainViewProvider>
  )
}
