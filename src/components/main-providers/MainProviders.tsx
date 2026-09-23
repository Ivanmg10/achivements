'use client'

import { RecentAchievementsProvider } from '@/context/RecentAchievementsContext'
import { RecentlyPlayedGamesProvider } from '@/context/RecentlyPlayedGamesContext'
import { ActivityHeatmapYearProvider } from '@/context/ActivityHeatmapYearContext'
import { GamesDataProvider } from '@/context/GamesDataContext'
import { MainViewProvider } from '@/context/MainViewContext'
import { MainPlatformProvider } from '@/context/MainPlatformContext'
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
                  {/* Inside Steam's provider: it falls back to RA when Steam is not linked. */}
                  <MainPlatformProvider>
                    {children}
                  </MainPlatformProvider>
                </SteamGamesDataProvider>
              </PinnedGamesProvider>
            </GamesDataProvider>
          </ActivityHeatmapYearProvider>
        </RecentlyPlayedGamesProvider>
      </RecentAchievementsProvider>
    </MainViewProvider>
  )
}
