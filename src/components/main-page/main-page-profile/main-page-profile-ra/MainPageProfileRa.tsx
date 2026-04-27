'use client'

import {
  RecentAchievement,
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

import MainPageProfileRaAchievements from './main-page-profile-ra-achievements/MainPageProfileRaAchievements'
import MainPageProfileRaGame from './main-page-profile-ra-game/MainPageProfileRaGame'
import MainPageProfileRaStats from './main-page-profile-ra-stats/MainPageProfileRaStats'

export default function MainPageProfileRa({
  user,
  game,
  recentAchievements,
}: {
  user: RetroAchievementsUserProfile | null | undefined
  game: RetroAchievementsGameWithAchievements | null | undefined
  recentAchievements: RecentAchievement[]
}) {
  const { T } = useLanguage()

  const hardcoreRatio =
    user && user.TotalTruePoints > 0
      ? Math.round((user.TotalTruePoints / (user.TotalPoints || 1)) * 100)
      : 0

  const ringColor =
    hardcoreRatio >= 80
      ? 'ring-yellow-400'
      : hardcoreRatio >= 50
        ? 'ring-blue-400'
        : 'ring-gray-600'

  const memberYear = user?.MemberSince ? new Date(user.MemberSince).getFullYear() : null
  const hasContribs = user && (user.ContribCount > 0 || user.ContribYield > 0)

  return (
    <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2 h-full">
      {user?.User ? (
        <>
          <div className="flex gap-3 items-center">
            {user?.UserPic && (
              <Image
                src={`https://retroachievements.org${user.UserPic}`}
                alt="UserPic"
                width={90}
                height={90}
                className={`m-1 rounded-lg ring-2 ${ringColor}`}
              />
            )}
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-bold leading-tight">{user.User}</p>
              {user.Motto && (
                <p className="text-xs text-gray-400 italic">&ldquo;{user.Motto}&rdquo;</p>
              )}
              {memberYear && <p className="text-xs text-gray-500">{T.profileRa.memberSince} {memberYear}</p>}
            </div>
          </div>

          <MainPageProfileRaStats user={user} hardcoreRatio={hardcoreRatio} />

          {game && <MainPageProfileRaGame game={game} richPresenceMsg={user?.RichPresenceMsg} />}

          {recentAchievements.length > 0 && (
            <MainPageProfileRaAchievements achievements={recentAchievements} />
          )}

          {hasContribs && (
            <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{T.profileRa.contributions}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-purple-400">
                    {user.ContribCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">{T.profileRa.achievementsCreated}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-pink-400">
                    {user.ContribYield.toLocaleString()}
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
