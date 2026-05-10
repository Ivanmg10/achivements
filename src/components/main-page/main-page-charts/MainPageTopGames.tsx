'use client'

import { useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'

export default function MainPageTopGames({ achievements, isLoading }: { achievements: RecentAchievement[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  const data = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const byGame = achievements
      .filter((a) => a.Date.split(' ')[0] >= cutoffStr)
      .reduce((acc, a) => {
        if (!acc[a.GameTitle]) {
          acc[a.GameTitle] = { count: 0, gameId: a.GameID, icon: a.GameIcon, console: a.ConsoleName }
        }
        acc[a.GameTitle].count++
        return acc
      }, {} as Record<string, { count: number; gameId?: number; icon?: string; console?: string }>)

    return Object.entries(byGame)
      .map(([name, { count, gameId, icon, console: con }]) => ({ name, count, gameId, icon, console: con }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [achievements])

  if (isLoading) return <SkeletonGameList count={4} />

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.mostActiveGames}</p>
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">{T.cards.noData}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.mostActiveGames}</p>
      <div className="flex flex-col gap-2 flex-1">
        {data.map(({ name, count, gameId, icon, console: con }) => (
          <GameListRow
            key={name}
            href={gameId ? `/gameInfo/${gameId}` : '#'}
            imageUrl={icon ? `https://retroachievements.org${icon}` : undefined}
            imageAlt={name}
            title={name}
            subtitle={con}
            stat={String(count)}
            statLabel={T.lineChart.achievements}
            statClassName="text-accent"
          />
        ))}
      </div>
    </div>
  )
}
