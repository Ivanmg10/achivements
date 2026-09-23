'use client'

import Image from 'next/image'
import Link from 'next/link'
import { UserAwards } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

export default function MainPageMastery({
  awards,
  isLoading,
  unlockedHC,
  unlockedSC,
}: {
  awards: UserAwards | null
  isLoading?: boolean
  unlockedHC: number
  unlockedSC: number
}) {
  const { T } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.masteryAwards}</p>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  const masteries = awards.MasteryAwardsCount ?? 0

  /**
   * The award mix as parts of one whole, in fixed order. The four hues were
   * checked with the palette validator: they clear the colourblind and
   * lightness bands on both themes, and every band is labelled besides.
   */
  const mix = [
    { value: masteries, label: T.cards.mastered, color: 'bg-[#D97706]' },
    { value: awards.CompletionAwardsCount ?? 0, label: T.cards.completedSC, color: 'bg-[#2563EB]' },
    { value: awards.BeatenHardcoreAwardsCount ?? 0, label: T.userStats.beatenHC, color: 'bg-[#15803D]' },
    { value: awards.BeatenSoftcoreAwardsCount ?? 0, label: T.userStats.beatenSC, color: 'bg-[#9333EA]' },
  ]
  const mixTotal = mix.reduce((sum, m) => sum + m.value, 0)

  // Supporting numbers: they explain the headline, they do not compete with it.
  const stats = [
    { value: unlockedHC.toLocaleString(), label: T.userStats.unlockedHC },
    { value: unlockedSC.toLocaleString(), label: T.userStats.unlockedSC },
    ...((awards.EventAwardsCount ?? 0) > 0
      ? [{ value: String(awards.EventAwardsCount), label: T.userStats.events }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.masteryAwards}</p>

      {/*
        Wide card: the award totals sit beside the games mastered lately, and
        spread across the full width before there are any masteries to show.
      */}
      <div className={`grid gap-4 ${recentCovers.length > 0 ? 'lg:grid-cols-[3fr_2fr]' : ''}`}>
        <div className="flex flex-col gap-4">
          {/* The headline: masteries, against every award earned. */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-warning tabular-nums leading-none">{masteries}</span>
            <span className="text-xs text-text-secondary">
              {T.cards.mastered} · {(awards.TotalAwardsCount ?? mixTotal).toLocaleString()} {T.userStats.awards.toLowerCase()}
            </span>
          </div>

          {mixTotal > 0 && (
            <div className="flex flex-col gap-2">
              <div
                className="flex gap-0.5 h-2.5"
                role="img"
                aria-label={mix.map((m) => `${m.label}: ${m.value}`).join(', ')}
              >
                {mix.map((m) => (
                  m.value > 0 && (
                    <div
                      key={m.label}
                      className={`${m.color} first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${(m.value / mixTotal) * 100}%` }}
                    />
                  )
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {mix.map((m) => (
                  <li key={m.label} className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                    <span className={`w-2 h-2 rounded-sm shrink-0 ${m.color}`} aria-hidden="true" />
                    {m.label}
                    <span className="text-text-main tabular-nums">{m.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="text-sm font-semibold text-text-main tabular-nums">{value}</span>
                <span className="text-[10px] text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>

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
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border border-bg-card" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
