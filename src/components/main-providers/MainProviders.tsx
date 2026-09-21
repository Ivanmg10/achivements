'use client'

import { RecentAchievementsProvider } from '@/context/RecentAchievementsContext'
import { RecentlyPlayedGamesProvider } from '@/context/RecentlyPlayedGamesContext'
import { ActivityHeatmapYearProvider } from '@/context/ActivityHeatmapYearContext'
import { GamesDataProvider } from '@/context/GamesDataContext'
import { MainViewProvider } from '@/context/MainViewContext'
import { PinnedGamesProvider } from '@/context/PinnedGamesContext'
import { SteamGamesDataProvider } from '@/context/SteamGamesDataContext'

export function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <MainViewProvider>
      <RecentAchievementsProvider>
        <RecentlyPlayedGamesProvider>
          <ActivityHeatmapYearProvider>
            <GamesDataProvider>
              <PinnedGamesProvider>
                <SteamGamesDataProvider>
                  {children}
                </SteamGamesDataProvider>
              </PinnedGamesProvider>
            </GamesDataProvider>
          </ActivityHeatmapYearProvider>
        </RecentlyPlayedGamesProvider>
      </RecentAchievementsProvider>
    </MainViewProvider>
  )
}
