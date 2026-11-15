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
import { VaultFillProvider } from '@/context/VaultFillContext'
import PreferencesSync from '@/components/preferences-sync/PreferencesSync'
import PresenceHeartbeat from '@/components/presence-heartbeat/PresenceHeartbeat'

export function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <MainViewProvider>
      <PreferencesSync />
      <PresenceHeartbeat />
      <BackInterceptProvider>
      <HiddenGamesProvider>
      <RecentAchievementsProvider>
        <RecentlyPlayedGamesProvider>
          <ActivityHeatmapYearProvider>
            <GamesDataProvider>
              <PinnedGamesProvider>
                <ShowcaseProvider>
                <SteamGamesDataProvider>
                <PsnGamesDataProvider>
                <XboxGamesDataProvider>
                  {/* Inside the Steam, PSN and Xbox providers: it falls back to a linked platform. */}
                  <MainPlatformProvider>
                    <VaultFillProvider>{children}</VaultFillProvider>
                  </MainPlatformProvider>
                </XboxGamesDataProvider>
                </PsnGamesDataProvider>
                </SteamGamesDataProvider>
                </ShowcaseProvider>
              </PinnedGamesProvider>
            </GamesDataProvider>
          </ActivityHeatmapYearProvider>
        </RecentlyPlayedGamesProvider>
      </RecentAchievementsProvider>
      </HiddenGamesProvider>
      </BackInterceptProvider>
    </MainViewProvider>
  )
}
