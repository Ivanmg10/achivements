'use client'

import { RecentAchievementsProvider } from '@/context/RecentAchievementsContext'
import { RecentlyPlayedGamesProvider } from '@/context/RecentlyPlayedGamesContext'
import { ActivityHeatmapYearProvider } from '@/context/ActivityHeatmapYearContext'
import { GamesDataProvider } from '@/context/GamesDataContext'
import { MainViewProvider } from '@/context/MainViewContext'
import { BackInterceptProvider } from '@/context/BackInterceptContext'
import { MainPlatformProvider } from '@/context/MainPlatformContext'
import { PinnedGamesProvider } from '@/context/PinnedGamesContext'
import { HiddenGamesProvider } from '@/context/HiddenGamesContext'
import { SteamGamesDataProvider } from '@/context/SteamGamesDataContext'
import { PsnGamesDataProvider } from '@/context/PsnGamesDataContext'
import { XboxGamesDataProvider } from '@/context/XboxGamesDataContext'
import { ShowcaseProvider } from '@/context/ShowcaseContext'
import PreferencesSync from '@/components/preferences-sync/PreferencesSync'
import PresenceHeartbeat from '@/components/presence-heartbeat/PresenceHeartbeat'

export function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <MainViewProvider>
      <PreferencesSync />
      <PresenceHeartbeat />
      <BackInterceptProvider>
      <RecentAchievementsProvider>
        <RecentlyPlayedGamesProvider>
          <ActivityHeatmapYearProvider>
            <GamesDataProvider>
              <PinnedGamesProvider>
                <ShowcaseProvider>
                <HiddenGamesProvider>
                <SteamGamesDataProvider>
                <PsnGamesDataProvider>
                <XboxGamesDataProvider>
                  {/* Inside the Steam, PSN and Xbox providers: it falls back to a linked platform. */}
                  <MainPlatformProvider>
                    {children}
                  </MainPlatformProvider>
                </XboxGamesDataProvider>
                </PsnGamesDataProvider>
                </SteamGamesDataProvider>
                </HiddenGamesProvider>
                </ShowcaseProvider>
              </PinnedGamesProvider>
            </GamesDataProvider>
          </ActivityHeatmapYearProvider>
        </RecentlyPlayedGamesProvider>
      </RecentAchievementsProvider>
      </BackInterceptProvider>
    </MainViewProvider>
  )
}
