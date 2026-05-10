'use client'

import { useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'

export default function MainPageRarest({ achievements, isLoading }: { achievements: RecentAchievement[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  const withRarity = useMemo(() =>
    achievements
      .filter((a) => a.TrueRatio !== undefined && a.TrueRatio > a.Points)
      .sort((a, b) => (b.TrueRatio ?? 0) - (a.TrueRatio ?? 0))
      .slice(0, 6),
    [achievements]
  )

  if (isLoading) return <SkeletonGameList count={4} />

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
          <GameListRow
            key={a.AchievementID}
            href={a.GameID ? `/gameInfo/${a.GameID}` : '#'}
            imageUrl={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
            imageAlt={a.Title}
            title={a.Title}
            subtitle={a.GameTitle}
            stat={String(a.TrueRatio)}
            statLabel={T.cards.trueRatio}
            statClassName="text-yellow-400"
          />
        ))}
      </div>
    </div>
  )
}
