'use client'

import { RecentAchievementsProvider } from '@/contexts/RecentAchievementsContext'
import { GamesDataProvider } from '@/contexts/GamesDataContext'
import { MainViewProvider } from '@/contexts/MainViewContext'

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
