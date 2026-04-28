import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RecentAchievement } from '@/types/types'

export default function MainPageRarest({ achievements }: { achievements: RecentAchievement[] }) {
  const withRarity = useMemo(() =>
    achievements
      .filter((a) => a.TrueRatio !== undefined && a.TrueRatio > a.Points)
      .sort((a, b) => (b.TrueRatio ?? 0) - (a.TrueRatio ?? 0))
      .slice(0, 6),
    [achievements]
  )

  if (withRarity.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary text-sm">
        No rarity data
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Rarest unlocked</p>
      <div className="flex flex-col gap-2">
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
              <span className="text-[9px] text-text-secondary">true pts</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
