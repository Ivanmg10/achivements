'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

export default function MainPageRarest({ achievements, isLoading }: { achievements: RecentAchievement[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  const withRarity = useMemo(() =>
    achievements
      .filter((a) => a.TrueRatio !== undefined && a.TrueRatio > a.Points)
      .sort((a, b) => (b.TrueRatio ?? 0) - (a.TrueRatio ?? 0))
      .slice(0, 6),
    [achievements]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-2 w-32 rounded bg-white/10" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 bg-bg-main rounded-lg p-2">
            <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
            <div className="flex flex-col flex-1 gap-1.5">
              <div className="h-2.5 w-24 rounded bg-white/10" />
              <div className="h-2 w-16 rounded bg-white/10" />
            </div>
            <div className="h-3 w-8 rounded bg-white/10 shrink-0" />
          </div>
        ))}
      </div>
    )
  }

  if (withRarity.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary text-sm">
        {T.cards.noRarityData}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.rarestUnlocks}</p>
      <div className="flex flex-col gap-2 flex-1">
        {withRarity.map((a) => (
          <Link
            key={a.AchievementID}
            href={a.GameID ? `/gameInfo/${a.GameID}` : '#'}
            className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <Image
              src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
              alt={a.Title}
              width={28}
              height={28}
              className="rounded shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{a.Title}</span>
              <span className="text-[10px] text-text-secondary truncate">{a.GameTitle}</span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-xs font-bold text-yellow-400">{a.TrueRatio}</span>
              <span className="text-[9px] text-text-secondary">{T.cards.trueRatio}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
