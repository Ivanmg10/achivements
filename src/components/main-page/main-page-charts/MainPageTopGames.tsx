'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-2 w-40 rounded bg-white/10" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 bg-bg-main rounded-lg p-2">
            <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
            <div className="flex flex-col flex-1 gap-1.5">
              <div className="h-2.5 w-24 rounded bg-white/10" />
              <div className="h-2 w-16 rounded bg-white/10" />
            </div>
            <div className="h-3 w-6 rounded bg-white/10 shrink-0" />
          </div>
        ))}
      </div>
    )
  }

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
          <Link
            key={name}
            href={gameId ? `/gameInfo/${gameId}` : '#'}
            className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {icon && (
              <Image
                src={`https://retroachievements.org${icon}`}
                alt={name}
                width={28}
                height={28}
                className="rounded shrink-0"
              />
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{name}</span>
              {con && <span className="text-[10px] text-text-secondary truncate">{con}</span>}
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-xs font-bold text-accent">{count}</span>
              <span className="text-[9px] text-text-secondary">{T.lineChart.achievements}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
