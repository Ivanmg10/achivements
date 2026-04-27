'use client'

import { RecentAchievement } from '@/types/types'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

export default function MainPageProfileRaAchievements({ achievements }: { achievements: RecentAchievement[] }) {
  const { T } = useLanguage()

  return (
    <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{T.profileAchievements.recentAchievements}</p>
      <div className="flex flex-col gap-2">
        {achievements.slice(0, 5).map((ach) => (
          <div key={ach.AchievementID} className="flex gap-2 items-center">
            <Image
              src={`https://media.retroachievements.org/Badge/${ach.BadgeName}.png`}
              alt={ach.Title}
              width={36}
              height={36}
              className="rounded shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">{ach.Title}</span>
              <span className="text-xs text-gray-500 truncate">{ach.GameTitle}</span>
            </div>
            <span
              className={`text-xs ml-auto shrink-0 ${ach.HardcoreMode === '1' ? 'text-yellow-400' : 'text-gray-400'}`}
            >
              {ach.Points}pts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
