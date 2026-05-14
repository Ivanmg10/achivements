'use client'

import { RecentAchievementsProvider } from '@/context/RecentAchievementsContext'
import { GamesDataProvider } from '@/context/GamesDataContext'
import { MainViewProvider } from '@/context/MainViewContext'

export function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <MainViewProvider>
      <RecentAchievementsProvider>
        <GamesDataProvider>
          {children}
        </GamesDataProvider>
      </RecentAchievementsProvider>
    </MainViewProvider>
  )
}
