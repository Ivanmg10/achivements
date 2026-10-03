'use client'

import { RecentAchievement } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import EmptyState from '@/components/empty-state/EmptyState'

export default function MainPageProfileRaAchievements({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()

  return (
    // Room for the three rows it can hold, loading or loaded: the profile column
    // sets the height of the home page's top row, so this box changing size as
    // it filled made the whole page jump.
    <div className="bg-bg-main rounded-lg p-3 flex flex-col gap-2 flex-1 min-h-[176px]">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{T.profileAchievements.recentAchievements}</p>
      {isLoading && achievements.length === 0 ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center p-1">
              <div className="w-9 h-9 rounded bg-ink/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-2.5 bg-ink/10 rounded w-3/4" />
                <div className="h-2 bg-ink/10 rounded w-1/2" />
              </div>
              <div className="w-8 h-3 bg-ink/10 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.cards.noEarned} size="compact" className="flex-1" />
      ) : (
      <div className="flex flex-col gap-2">
        {achievements.slice(0, 3).map((ach) => (
          <Link
            key={ach.AchievementID}
            href={`/gameInfo/${ach.GameID}`}
            className="flex gap-2 items-center rounded-lg hover:bg-ink/5 transition-colors group p-1 -mx-1"
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
