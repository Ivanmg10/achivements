'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RecentAchievement } from '@/types/types'

export default function MainPageTopGames({ achievements }: { achievements: RecentAchievement[] }) {
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

  if (data.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Most played — last 30 days</p>
      <div className="flex flex-col gap-2">
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
              <span className="text-[9px] text-text-secondary">ach</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
