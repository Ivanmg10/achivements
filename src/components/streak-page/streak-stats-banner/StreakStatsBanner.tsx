'use client'

import { IconFlame, IconTrendingUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'
import { formatDay, plural } from '@/utils/utils'

interface Props {
  activeStreak: Streak | null
  bestStreak: Streak | null
  totalStreaks: number
  /** The most recent day with an achievement, for when there is no streak going. */
  lastActiveDay: string | null
}

/**
 * The two numbers that matter: the streak going now (and how far it is from
 * the record, or when the last achievement was if none is going) and the
 * best one so far.
 */
export default function StreakStatsBanner({ activeStreak, bestStreak, totalStreaks, lastActiveDay }: Props) {
  const { T, lang } = useLanguage()
  const range = (s: Streak) =>
    `${formatDay(s.start, lang, { day: 'numeric', month: 'short' })} – ${formatDay(s.end, lang, { day: 'numeric', month: 'short' })}`

  let nudge: string | null = null
  if (activeStreak && bestStreak) {
    nudge =
      activeStreak.days >= bestStreak.days
        ? T.streak.newRecord
        : T.streak.toBeatRecord.replace('{days}', plural(bestStreak.days - activeStreak.days + 1, T.plurals.days, lang))
  } else if (lastActiveDay) {
    nudge = T.streak.lastActive.replace('{date}', formatDay(lastActiveDay, lang, { weekday: 'long', day: 'numeric', month: 'long' }))
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-bg-card rounded-2xl p-5 flex items-center gap-4">
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${activeStreak ? 'bg-orange-400/10' : 'bg-ink/5'}`}>
          <IconFlame className={`w-6 h-6 ${activeStreak ? 'text-orange-400' : 'text-text-secondary'}`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-text-secondary">{T.streak.currentStreak}</p>
          {activeStreak ? (
            <>
              <p className="text-2xl font-bold text-text-main leading-tight">{plural(activeStreak.days, T.plurals.days, lang)}</p>
              <p className="text-xs text-text-secondary mt-0.5">{range(activeStreak)}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-text-main">{T.streak.noStreak}</p>
              <p className="text-xs text-text-secondary mt-0.5">{T.streak.noStreakSub}</p>
            </>
          )}
          {nudge && <p className="text-xs font-medium text-accent mt-1.5">{nudge}</p>}
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl p-5 flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 shrink-0">
          <IconTrendingUp className="w-6 h-6 text-accent" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-text-secondary">{T.streak.bestStreak}</p>
          {bestStreak ? (
            <>
              <p className="text-2xl font-bold text-text-main leading-tight">{plural(bestStreak.days, T.plurals.days, lang)}</p>
              <p className="text-xs text-text-secondary mt-0.5">{range(bestStreak)}</p>
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
