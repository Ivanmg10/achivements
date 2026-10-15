'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { useCheevoUser } from '@/hooks/useCheevoUser'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { useStreakData } from '@/hooks/useStreakData'
import SubjectProviders from '@/components/subject-providers/SubjectProviders'
import PublicUserSkeleton from './public-user-skeleton/PublicUserSkeleton'
import PublicUserError from './public-user-error/PublicUserError'
import PublicUserBody from './public-user-body/PublicUserBody'
import PublicUserHero from './public-user-hero/PublicUserHero'
import type { ViewerStats } from './public-user-compare/PublicUserCompare'

/**
 * A CheevoVault user's page: who they are, their pace, games and stats on
 * every platform they linked, and how they compare with you.
 *
 * Everything inside SubjectProviders is read as them. Your own numbers, for
 * the comparison, are read here, outside it, from what the app already holds.
 */
export default function PublicUserPage({ username }: { username: string }) {
  const { T } = useLanguage()
  const { data: session } = useSession()
  const { user, isLoading, error, retry } = useCheevoUser(username)
  const mine = useProfileLibrary()
  const myYear = useStreakData()

  const viewer: ViewerStats = useMemo(
    () => ({
      name: session?.user?.name ?? '',
      avatar: session?.user?.avatar ?? null,
      games: mine.games,
      year: myYear.achievements,
      activeStreak: myYear.activeStreak,
      bestStreak: myYear.bestStreak,
      isLoading: mine.isLoading || myYear.isLoading,
    }),
    [session?.user?.name, session?.user?.avatar, mine.games, mine.isLoading, myYear.achievements, myYear.activeStreak, myYear.bestStreak, myYear.isLoading],
  )

  if (error) return <PublicUserError username={username} error={error} onRetry={retry} />

  if (isLoading || !user) {
    return <PublicUserSkeleton />
  }

  return (
    <div className="min-h-full text-text-main flex flex-col items-center py-4 sm:py-6 px-4">
      <div className="w-full lg:max-w-[95%] min-w-0">
        <SubjectProviders user={user}>
          {user.ra || user.steam || user.psn || user.xbox ? (
            <PublicUserBody user={user} viewer={viewer} />
          ) : (
            <div className="flex flex-col gap-4">
              <PublicUserHero user={user} />
              <p className="py-12 text-center text-sm text-text-secondary">{T.publicProfile.noAccounts}</p>
            </div>
          )}
        </SubjectProviders>
      </div>
    </div>
  )
}
