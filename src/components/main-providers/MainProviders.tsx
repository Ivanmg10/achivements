'use client'

import { RecentAchievementsProvider } from '@/contexts/RecentAchievementsContext'
import { GamesDataProvider } from '@/contexts/GamesDataContext'

export function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <RecentAchievementsProvider>
      <GamesDataProvider>
        {children}
      </GamesDataProvider>
    </RecentAchievementsProvider>
  )
}
