'use client'

import { useMemo, type ReactNode } from 'react'
import { SessionContext } from 'next-auth/react'
import type { Session } from 'next-auth'
import { SubjectContext } from '@/context/SubjectContext'
import { RecentAchievementsProvider } from '@/context/RecentAchievementsContext'
import { RecentlyPlayedGamesProvider } from '@/context/RecentlyPlayedGamesContext'
import { ActivityHeatmapYearProvider } from '@/context/ActivityHeatmapYearContext'
import { GamesDataProvider } from '@/context/GamesDataContext'
import { SteamGamesDataProvider } from '@/context/SteamGamesDataContext'
import { PsnGamesDataProvider } from '@/context/PsnGamesDataContext'
import { MainPlatformProvider } from '@/context/MainPlatformContext'
import { usePublicUserProfile } from '@/hooks/usePublicUserProfile'
import type { CheevoUser } from '@/hooks/useCheevoUser'

/**
 * Everything below shows `user`'s data instead of the signed-in user's, with
 * no change to the components themselves: the same main page, read through the
 * same providers and hooks.
 *
 * Two things make that work. Below here the session IS that user (an id, their
 * linked platforms, their RA profile), so every provider asks what it would for
 * its own user; and SubjectContext makes each read carry `?user=<name>`, which
 * is what the server answers for (see dataOwner). The viewer's own pins, hidden
 * games and groups live above this and are not touched.
 *
 * RetroAchievements is read with the viewer's key if they have one, and
 * otherwise with the user's own, on the server: a viewer needs no RA account.
 */
export default function SubjectProviders({ user, children }: { user: CheevoUser; children: ReactNode }) {
  // `ra` is only set when someone can read it (see /api/users/[username]).
  const showRa = Boolean(user.ra)
  const { profile } = usePublicUserProfile(showRa ? user.username : '')

  const session = useMemo(() => {
    // Keys, not real ids: the server resolves the account from the name.
    const key = `subject:${user.username}`
    return {
      status: 'authenticated' as const,
      update: async () => null,
      data: {
        expires: '',
        user: {
          id: key,
          name: user.username,
          avatar: user.avatar ?? undefined,
          location: user.location,
          description: user.description,
          rausername: showRa ? (user.ra ?? undefined) : undefined,
          raLinked: showRa,
          raUser: showRa ? profile : null,
          steamid: user.steam ? key : undefined,
          psnaccountid: user.psn ? key : undefined,
        },
      } as Session,
    }
  }, [user, showRa, profile])

  return (
    <SubjectContext.Provider value={user.username}>
      <SessionContext.Provider value={session}>
        <RecentAchievementsProvider>
          <RecentlyPlayedGamesProvider>
            <ActivityHeatmapYearProvider>
              <GamesDataProvider>
                <SteamGamesDataProvider>
                  <PsnGamesDataProvider>
                    <MainPlatformProvider>{children}</MainPlatformProvider>
                  </PsnGamesDataProvider>
                </SteamGamesDataProvider>
              </GamesDataProvider>
            </ActivityHeatmapYearProvider>
          </RecentlyPlayedGamesProvider>
        </RecentAchievementsProvider>
      </SessionContext.Provider>
    </SubjectContext.Provider>
  )
}
