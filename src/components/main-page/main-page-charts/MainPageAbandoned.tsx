'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RetroAchievementsGameCompleted } from '@/types/types'

const ABANDONED_DAYS = 90

export default function MainPageAbandoned({ playing }: { playing: RetroAchievementsGameCompleted[] }) {
  const [lastAchDates, setLastAchDates] = useState<Record<number, string>>({})

  const allIdsKey = useMemo(() => playing.map((g) => g.GameID).join(','), [playing])

  useEffect(() => {
    if (!allIdsKey) return
    fetch(`/api/getGamesLastPlayed?gameIds=${allIdsKey}`)
      .then((r) => r.json())
      .then((data) => { if (typeof data === 'object' && data) setLastAchDates(data) })
  }, [allIdsKey])

  const abandoned = useMemo(() => {
    const now = new Date()
    return playing
      .map((g) => {
        const dateStr = lastAchDates[g.GameID]
        const last = dateStr ? new Date(dateStr.replace(' ', 'T')) : null
        const daysAgo = last
          ? Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
          : null
        return { ...g, daysAgo }
      })
      .filter((g): g is typeof g & { daysAgo: number } => g.daysAgo !== null && g.daysAgo >= ABANDONED_DAYS)
      .sort((a, b) => b.daysAgo - a.daysAgo)
  }, [playing, lastAchDates])

  if (abandoned.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Abandoned games</p>
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">
          No abandoned games
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
        Abandoned (+{ABANDONED_DAYS}d no activity)
      </p>
      <div className="flex flex-col gap-2">
        {abandoned.slice(0, 6).map((g) => (
          <Link
            key={g.GameID}
            href={`/gameInfo/${g.GameID}`}
            className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {g.ImageIcon && (
              <Image
                src={`https://retroachievements.org${g.ImageIcon}`}
                alt={g.Title}
                width={28}
                height={28}
                className="rounded shrink-0"
              />
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">
                {g.Title}
              </span>
              <span className="text-[10px] text-text-secondary">{g.ConsoleName}</span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-xs font-bold text-orange-400">{g.daysAgo}d</span>
              <span className="text-[9px] text-text-secondary">
                {Math.round(parseFloat(g.PctWon) * 100)}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
