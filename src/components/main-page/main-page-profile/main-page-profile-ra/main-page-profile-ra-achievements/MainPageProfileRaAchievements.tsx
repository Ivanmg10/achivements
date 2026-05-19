'use client'

import { RecentAchievement } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function MainPageProfileRaAchievements({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()

  return (
    <div className="bg-bg-main rounded-lg p-3 flex flex-col gap-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{T.profileAchievements.recentAchievements}</p>
      {isLoading && achievements.length === 0 ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center p-1">
              <div className="w-9 h-9 rounded bg-white/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-2.5 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
              </div>
              <div className="w-8 h-3 bg-white/10 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : (
      <div className="flex flex-col gap-2">
        {achievements.slice(0, 5).map((ach) => (
          <Link
            key={ach.AchievementID}
            href={`/gameInfo/${ach.GameID}`}
            className="flex gap-2 items-center rounded-lg hover:bg-white/5 transition-colors group p-1 -mx-1"
          >
            <Image
              src={`https://media.retroachievements.org/Badge/${ach.BadgeName}.png`}
              alt={ach.Title}
              width={36}
              height={36}
              className="rounded shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{ach.Title}</span>
              <span className="text-xs text-gray-500 truncate">{ach.GameTitle}</span>
            </div>
            <span
              className={`text-xs ml-auto shrink-0 ${ach.HardcoreMode === '1' ? 'text-yellow-400' : 'text-gray-400'}`}
            >
              {ach.Points}pts
            </span>
          </Link>
        ))}
      </div>
      )}
    </div>
  )
}
