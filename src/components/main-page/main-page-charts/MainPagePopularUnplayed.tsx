'use client'

import Link from 'next/link'
import Image from 'next/image'
import { PopularGame } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

export default function MainPagePopularUnplayed({
  games,
  isLoading,
  error,
}: {
  games: PopularGame[]
  isLoading?: boolean
  error?: boolean
}) {
  const { T } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.popularUnplayed}</p>
        <div className="flex items-center justify-center py-6 text-text-secondary text-sm">{T.cards.loading}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.popularUnplayed}</p>
        <div className="flex items-center justify-center py-6 text-text-secondary text-sm" role="alert">{T.charts.failedToLoad}</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.popularUnplayed}</p>
        <div className="flex items-center justify-center py-6 text-text-secondary text-sm">{T.charts.popularPlayedAll}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.popularUnplayed}</p>
      <div className="flex flex-col gap-2">
        {games.slice(0, 6).map((g) => {
          const id = g.ID ?? 0
          return (
            <Link
              key={id}
              href={`/gameInfo/${id}`}
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
                <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{g.Title}</span>
                <span className="text-[10px] text-text-secondary">{g.ConsoleName}</span>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-[10px] text-text-secondary">{g.NumAchievements} ach</span>
                <span className="text-[10px] text-text-secondary">{g.Points} pts</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
