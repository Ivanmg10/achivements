'use client'

import { RecentAchievementsProvider } from '@/context/RecentAchievementsContext'
import { RecentlyPlayedGamesProvider } from '@/context/RecentlyPlayedGamesContext'
import { ActivityHeatmapYearProvider } from '@/context/ActivityHeatmapYearContext'
import { GamesDataProvider } from '@/context/GamesDataContext'
import { MainViewProvider } from '@/context/MainViewContext'
import { MainPlatformProvider } from '@/context/MainPlatformContext'
import { PinnedGamesProvider } from '@/context/PinnedGamesContext'
import { HiddenGamesProvider } from '@/context/HiddenGamesContext'
import { SteamGamesDataProvider } from '@/context/SteamGamesDataContext'
import { PsnGamesDataProvider } from '@/context/PsnGamesDataContext'

export function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <MainViewProvider>
      <RecentAchievementsProvider>
        <RecentlyPlayedGamesProvider>
          <ActivityHeatmapYearProvider>
            <GamesDataProvider>
              <PinnedGamesProvider>
                <HiddenGamesProvider>
                <SteamGamesDataProvider>
                <PsnGamesDataProvider>
                  {/* Inside the Steam and PSN providers: it falls back to a linked platform. */}
                  <MainPlatformProvider>
                    {children}
                  </MainPlatformProvider>
                </PsnGamesDataProvider>
                </SteamGamesDataProvider>
                </HiddenGamesProvider>
              </PinnedGamesProvider>
            </GamesDataProvider>
          </ActivityHeatmapYearProvider>
        </RecentlyPlayedGamesProvider>
      </RecentAchievementsProvider>
    </MainViewProvider>
  )
}
