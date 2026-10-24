'use client'

import {
  RecentAchievement,
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from '@/types/types'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

import MainPageProfileActions from '../main-page-profile-actions/MainPageProfileActions'
import MainPageProfileRaAchievements from './main-page-profile-ra-achievements/MainPageProfileRaAchievements'
import MainPageProfileRaGame from './main-page-profile-ra-game/MainPageProfileRaGame'
import MainPageProfileRaStats from './main-page-profile-ra-stats/MainPageProfileRaStats'
import MainPageProfileGameSkeleton from '../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import MainPageProfileCard from '../main-page-profile-card/MainPageProfileCard'
import { SURFACE } from '@/components/ui/surface'
import { StatCard } from '@/components/ui/StatPill'

export default function MainPageProfileRa({
  user,
  game,
  gameLoading,
  recentAchievements,
  achievementsLoading,
  onRefresh,
}: {
  user: RetroAchievementsUserProfile | null | undefined
  game: RetroAchievementsGameWithAchievements | null | undefined
  gameLoading?: boolean
  recentAchievements: RecentAchievement[]
  achievementsLoading?: boolean
  /** Only on the signed-in user's own page. */
  onRefresh?: () => void | Promise<void>
}) {
  const { T, lang } = useLanguage()

  const hardcoreRatio =
    user && (user.TotalTruePoints ?? 0) > 0
      ? Math.round(((user.TotalTruePoints ?? 0) / (user.TotalPoints || 1)) * 100)
      : 0

  // The picture's ring says how much of the account is played in hardcore.
  const ring = hardcoreRatio >= 80 ? 'rgb(var(--hardcore))' : hardcoreRatio >= 50 ? 'rgb(var(--softcore))' : 'rgb(var(--ink) / 0.3)'

  const memberYear = user?.MemberSince ? new Date(user.MemberSince).getFullYear() : null
  const hasContribs = user && ((user.ContribCount ?? 0) > 0 || (user.ContribYield ?? 0) > 0)

  return (
    <div className="flex flex-col gap-3.5 w-full h-full">
      {user?.User ? (
        <>
          <MainPageProfileCard
            avatarSrc={user.UserPic ? `https://retroachievements.org${user.UserPic}` : null}
            avatarFallback={<span className="w-full h-full bg-bg-main" />}
            ring={ring}
            name={user.User}
            actions={
              <MainPageProfileActions
                href={`https://retroachievements.org/user/${user.User}`}
                linkLabel={T.profileRa.viewOnRA}
                ringClass="focus:ring-accent/70"
                onRefresh={onRefresh}
              />
            }
            stats={<MainPageProfileRaStats user={user} hardcoreRatio={hardcoreRatio} />}
          >
            {user.Motto && <p className="text-[0.8125rem] text-text-secondary italic line-clamp-2">&ldquo;{user.Motto}&rdquo;</p>}
            {memberYear && (
              <p className="text-[0.8125rem] text-text-secondary">
                {T.profileRa.memberSince} {memberYear}
              </p>
            )}
          </MainPageProfileCard>

          {gameLoading && !game ? (
            <MainPageProfileGameSkeleton />
          ) : game ? (
            <MainPageProfileRaGame game={game} richPresenceMsg={user?.RichPresenceMsg} />
          ) : null}

          <MainPageProfileRaAchievements achievements={recentAchievements} isLoading={achievementsLoading} />

          {hasContribs && (
            <div className={`${SURFACE} p-5 flex flex-col gap-3`}>
              <p className="text-[1.0625rem] font-bold">{T.profileRa.contributions}</p>
              <div className="grid grid-cols-2 gap-2">
                <StatCard label={T.profileRa.achievementsCreated} value={(user.ContribCount ?? 0).toLocaleString(lang)} />
                <StatCard label={T.profileRa.pointsContributed} value={(user.ContribYield ?? 0).toLocaleString(lang)} />
              </div>
            </div>
          )}
        </>
      ) : (
        <Link href="/user" className={`${SURFACE} p-5 font-semibold hover:ring-accent/50 transition-shadow`}>
          {T.profileRa.signIn}
        </Link>
      )}
    </div>
  )
}
