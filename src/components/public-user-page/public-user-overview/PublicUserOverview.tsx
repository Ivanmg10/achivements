'use client'

import { useRaLinked } from '@/hooks/useRaLinked'
import type { CheevoUser } from '@/hooks/useCheevoUser'
import type { LibraryGame } from '@/utils/library'
import RARecentlyPlayed from '@/components/ra-recently-played/RARecentlyPlayed'
import RecentGamesList from '@/components/recent-games-list/RecentGamesList'
import MainPageProfile from '@/components/main-page/main-page-profile/MainPageProfile'
import PublicUserRecentUnlocks from '../public-user-recent-unlocks/PublicUserRecentUnlocks'
import PublicUserPlatforms from '../public-user-platforms/PublicUserPlatforms'
import PublicUserShowcase from '../public-user-showcase/PublicUserShowcase'
import PublicUserAbout from '../public-user-about/PublicUserAbout'

/**
 * The profile's first tab, read top to bottom: what they play now and their
 * account on each platform; their latest unlocks and games per platform; what
 * they show off; and what they chose for themselves.
 */
export default function PublicUserOverview({ user, games, gamesLoading }: { user: CheevoUser; games: LibraryGame[]; gamesLoading: boolean }) {
  const raLinked = useRaLinked()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* As tall as the profile beside it: no fixed height, so neither is cut. */}
        <div className="profile-recent bg-bg-card rounded-xl p-4 flex flex-col min-h-[26rem] min-w-0">
          {raLinked ? <RARecentlyPlayed /> : <RecentGamesList />}
        </div>
        <div className="flex flex-col min-w-0 [&>section]:m-0 [&>section]:flex-1 [&>section]:overflow-visible">
          <MainPageProfile />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="bg-bg-card rounded-xl p-4 min-w-0">
          <PublicUserRecentUnlocks />
        </div>
        <div className="bg-bg-card rounded-xl p-4 min-w-0">
          <PublicUserPlatforms games={games} isLoading={gamesLoading} />
        </div>
      </div>

      <PublicUserShowcase />

      <PublicUserAbout user={user} />
    </div>
  )
}
