'use client'

import { IconFlame, IconTrendingUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'

interface Props {
  activeStreak: Streak | null
  bestStreak: Streak | null
  totalStreaks: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('default', {
    day: 'numeric',
    month: 'short',
  })
}

export default function StreakStatsBanner({ activeStreak, bestStreak, totalStreaks }: Props) {
  const { T } = useLanguage()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Current streak */}
      <div className="bg-bg-card rounded-2xl p-5 flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-400/10 shrink-0">
          <IconFlame className="w-6 h-6 text-orange-400" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-text-secondary">{T.streak.currentStreak}</p>
          {activeStreak ? (
            <>
              <p className="text-2xl font-bold text-text-main leading-tight">
                {activeStreak.days} <span className="text-base font-normal text-text-secondary">{T.streak.days}</span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatDate(activeStreak.start)} – {formatDate(activeStreak.end)}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-text-secondary">{T.streak.noStreak}</p>
              <p className="text-xs text-text-secondary mt-0.5">{T.streak.noStreakSub}</p>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-bg-card rounded-2xl p-5 flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 shrink-0">
          <IconTrendingUp className="w-6 h-6 text-accent" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-text-secondary">{T.streak.bestStreak}</p>
          {bestStreak ? (
            <>
              <p className="text-2xl font-bold text-text-main leading-tight">
                {bestStreak.days} <span className="text-base font-normal text-text-secondary">{T.streak.days}</span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatDate(bestStreak.start)} – {formatDate(bestStreak.end)}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold text-text-secondary">—</p>
          )}
          <p className="text-xs text-text-secondary mt-0.5">
            {totalStreaks} {T.streak.totalStreaks.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  )
}
