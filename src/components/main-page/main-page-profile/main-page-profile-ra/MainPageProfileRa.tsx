'use client'

import {
  RecentAchievement,
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from '@/types/types'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { useUserRank } from '@/hooks/useUserRank'

import MainPageProfileActions from '../main-page-profile-actions/MainPageProfileActions'
import MainPageProfileRaAchievements from './main-page-profile-ra-achievements/MainPageProfileRaAchievements'
import MainPageProfileRaGame from './main-page-profile-ra-game/MainPageProfileRaGame'
import MainPageProfileRaStats from './main-page-profile-ra-stats/MainPageProfileRaStats'
import MainPageProfileGameSkeleton from '../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import MainPageProfileCard from '../main-page-profile-card/MainPageProfileCard'
import { SURFACE } from '@/components/ui/surface'
import Figure from '@/components/ui/Figure'
import { raImageUrl } from '@/utils/raAssets'
import { raPlayRing } from '@/utils/raRatio'
import Facts from '@/components/ui/Facts'
import { Skeleton } from '@/components/ui/Skeleton'

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
  const subject = useSubject()

  const { rank, isLoading: rankLoading } = useUserRank()

  const memberYear = user?.MemberSince ? new Date(user.MemberSince).getFullYear() : null
  const hasContribs = user && ((user.ContribCount ?? 0) > 0 || (user.ContribYield ?? 0) > 0)

  return (
    <div className="flex flex-col gap-3.5 w-full h-full">
      {user?.User ? (
        <>
          <MainPageProfileCard
            avatarSrc={raImageUrl(user.UserPic) ?? null}
            avatarFallback={<span className="w-full h-full bg-bg-main" />}
            ring={raPlayRing(user)}
            name={user.User}
            actions={
              <MainPageProfileActions
                href={`https://retroachievements.org/user/${user.User}`}
                linkLabel={T.profileRa.viewOnRA}
                ringClass="focus:ring-accent/70"
                onRefresh={onRefresh}
              />
            }
            stats={<MainPageProfileRaStats user={user} />}
          >
            {user.Motto && <p className="text-[0.8125rem] text-text-secondary italic line-clamp-2">&ldquo;{user.Motto}&rdquo;</p>}
            {/* The global rank is an account total: it lives on the card, not in the activity row (#128). */}
            <p className="text-[0.8125rem] text-text-secondary">
              <Facts
                items={[
                  memberYear && `${T.profileRa.memberSince} ${memberYear}`,
                  rankLoading && !rank ? <Skeleton key="rank" className="inline-block align-middle h-3 w-24" /> : rank?.Rank != null && `${T.userStats.globalRank} #${rank.Rank.toLocaleString(lang)}`,
                ]}
              />
            </p>
          </MainPageProfileCard>

          {gameLoading && !game ? (
            <MainPageProfileGameSkeleton />
          ) : game ? (
            <MainPageProfileRaGame game={game} richPresenceMsg={user?.RichPresenceMsg} />
          ) : null}

          {/* Someone's page lists their latest unlocks itself (#130): the column does not say them a second time. */}
          {!subject && <MainPageProfileRaAchievements achievements={recentAchievements} isLoading={achievementsLoading} />}

          {hasContribs && (
            <div className={`${SURFACE} p-5 flex flex-col gap-3`}>
              <p className="text-[1.0625rem] font-bold">{T.profileRa.contributions}</p>
              <div className="grid grid-cols-2 gap-2">
                <Figure look="card" label={T.profileRa.achievementsCreated} value={(user.ContribCount ?? 0).toLocaleString(lang)} />
                <Figure look="card" label={T.profileRa.pointsContributed} value={(user.ContribYield ?? 0).toLocaleString(lang)} />
              </div>
            </div>
          )}
        </>
      ) : (
        <Link href="/user" className={`${SURFACE} p-5 font-semibold hover:ring-accent/50 transition-shadow`}>
          {T.profileRa.connect}
        </Link>
      )}
    </div>
  )
}
