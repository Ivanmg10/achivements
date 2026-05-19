'use client'

import {
  RecentAchievement,
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'
import { IconExternalLink } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

import MainPageProfileRaAchievements from './main-page-profile-ra-achievements/MainPageProfileRaAchievements'
import MainPageProfileRaGame from './main-page-profile-ra-game/MainPageProfileRaGame'
import MainPageProfileRaStats from './main-page-profile-ra-stats/MainPageProfileRaStats'
// import MainPageProfileConsoles from '../main-page-profile-consoles/MainPageProfileConsoles'

export default function MainPageProfileRa({
  user,
  game,
  gameLoading,
  recentAchievements,
  achievementsLoading,
}: {
  user: RetroAchievementsUserProfile | null | undefined
  game: RetroAchievementsGameWithAchievements | null | undefined
  gameLoading?: boolean
  recentAchievements: RecentAchievement[]
  achievementsLoading?: boolean
}) {
  const { T } = useLanguage()

  const hardcoreRatio =
    user && (user.TotalTruePoints ?? 0) > 0
      ? Math.round(((user.TotalTruePoints ?? 0) / (user.TotalPoints || 1)) * 100)
      : 0

  const ringColor =
    hardcoreRatio >= 80
      ? 'ring-yellow-400'
      : hardcoreRatio >= 50
        ? 'ring-blue-400'
        : 'ring-gray-600'

  const memberYear = user?.MemberSince ? new Date(user.MemberSince).getFullYear() : null
  const hasContribs = user && ((user.ContribCount ?? 0) > 0 || (user.ContribYield ?? 0) > 0)

  return (
    <div className="relative flex flex-col gap-3 p-3 bg-bg-card rounded-xl w-full h-full">
      {user?.User ? (
        <>
          <a
            href={`https://retroachievements.org/user/${user.User}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-text-secondary hover:text-text-main text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70"
            aria-label={T.profileRa.viewOnRA}
          >
            <IconExternalLink className="w-3.5 h-3.5" />
            {T.profileRa.viewOnRA}
          </a>

          <div className="flex gap-3 items-center pr-24">
            {user?.UserPic && (
              <Image
                src={`https://retroachievements.org${user.UserPic}`}
                alt={`Avatar of ${user.User}`}
                width={90}
                height={90}
                className={`m-1 rounded-lg ring-2 shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5 ${ringColor}`}
              />
            )}
            <div className="flex flex-col gap-1 min-w-0 w-full">
              <p className="text-xl lg:text-2xl font-bold leading-tight truncate">{user.User}</p>
              {user.Motto && (
                <p className="text-xs text-gray-400 italic line-clamp-2">
                  &ldquo;{user.Motto}&rdquo;
                </p>
              )}
              {memberYear && (
                <p className="text-xs text-gray-500">
                  {T.profileRa.memberSince} {memberYear}
                </p>
              )}
            </div>
          </div>

          <MainPageProfileRaStats user={user} hardcoreRatio={hardcoreRatio} />

          {gameLoading && !game ? (
            <div className="bg-bg-main rounded-lg p-3 flex flex-col gap-3 animate-pulse">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-3 w-40 bg-white/10 rounded" />
              <div className="flex gap-3 items-center">
                <div className="w-12.5 h-12.5 rounded-lg bg-white/10 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3.5 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded" />
            </div>
          ) : game ? (
            <MainPageProfileRaGame game={game} richPresenceMsg={user?.RichPresenceMsg} />
          ) : null}

          {(recentAchievements.length > 0 || achievementsLoading) && (
            <MainPageProfileRaAchievements achievements={recentAchievements} isLoading={achievementsLoading} />
          )}

          {hasContribs && (
            <div className="flex flex-col gap-2 bg-bg-main rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {T.profileRa.contributions}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-purple-400">
                    {(user.ContribCount ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">{T.profileRa.achievementsCreated}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-pink-400">
                    {(user.ContribYield ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">{T.profileRa.pointsContributed}</span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Link
          href="/user"
          className="w-full text-left bg-bg-card p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
        >
          {T.profileRa.signIn}
        </Link>
      )}
    </div>
  )
}
