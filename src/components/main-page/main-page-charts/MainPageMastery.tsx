'use client'

import Image from 'next/image'
import Link from 'next/link'
import { UserAwards } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

export default function MainPageMastery({ awards, isLoading }: { awards: UserAwards | null; isLoading?: boolean }) {
  const { T } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.masteryAwards}</p>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-main rounded-lg h-16 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!awards) return null

  const mastered = awards.VisibleUserAwards?.filter((a) => a.AwardType === 'Mastery') ?? []
  const recentCovers = mastered.slice(0, 8)

  const stats = [
    { value: awards.MasteryAwardsCount,         label: T.cards.mastered,       color: 'text-yellow-400' },
    { value: awards.CompletionAwardsCount,       label: T.cards.completedSC,    color: 'text-purple-400' },
    { value: awards.BeatenHardcoreAwardsCount,   label: T.userStats.beatenHC,   color: 'text-blue-400'   },
    { value: awards.BeatenSoftcoreAwardsCount,   label: T.userStats.beatenSC,   color: 'text-text-main'  },
  ]

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.masteryAwards}</p>

      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ value, label, color }) => (
          <div key={label} className="bg-bg-main rounded-lg px-3 py-2.5 flex flex-col gap-0.5">
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            <span className="text-[10px] text-text-secondary">{label}</span>
          </div>
        ))}
      </div>

      {awards.EventAwardsCount > 0 && (
        <div className="bg-bg-main rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-text-secondary">{T.userStats.events}</span>
          <span className="text-sm font-bold text-green-400">{awards.EventAwardsCount}</span>
        </div>
      )}

      {/* 4-col mastery covers */}
      {recentCovers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest">{T.cards.recentMasteries}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {recentCovers.map((a, i) => (
              <Link
                key={i}
                href={`/gameInfo/${a.AwardData}`}
                title={`${a.Title} — ${a.ConsoleName}`}
                className="relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
              >
                {a.ImageIcon ? (
                  <Image
                    src={`https://retroachievements.org${a.ImageIcon}`}
                    alt={a.Title}
                    width={56}
                    height={56}
                    className="w-full aspect-square object-cover rounded hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full aspect-square rounded bg-white/10" />
                )}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-bg-card" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
