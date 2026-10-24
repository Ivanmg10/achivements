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
  /** The year's quick numbers, under the two streaks. */
  children?: React.ReactNode
}

/**
 * The top of the streak page, its one warm spot: the two numbers that matter, the streak going now (and how far it is from
 * the record, or when the last achievement was if none is going) and the
 * best one so far.
 */
export default function StreakStatsBanner({ activeStreak, bestStreak, totalStreaks, lastActiveDay, children }: Props) {
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
    <section aria-label={T.streak.currentStreak} className="relative overflow-hidden bg-bg-card rounded-card p-6 sm:p-8 flex flex-col gap-6">
      {/* The page's one warm spot: a glow behind the flame while a streak is going. */}
      {activeStreak && <div aria-hidden="true" className="absolute -left-16 -top-24 w-96 h-96 rounded-full bg-warning/15 blur-3xl pointer-events-none" />}
      <div className="relative flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
        <div className="flex items-center gap-5 min-w-0 flex-1">
          <IconFlame
            className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 ${activeStreak ? 'text-warning drop-shadow-[0_0_18px_rgb(var(--warning)/0.45)]' : 'text-text-secondary/50'}`}
            stroke={1.6}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-warning">{T.streak.currentStreak}</p>
            {activeStreak ? (
              <>
                <p className="font-display italic font-extrabold text-5xl sm:text-7xl leading-[1] pr-2 text-text-main">{plural(activeStreak.days, T.plurals.days, lang)}</p>
                <p className="text-sm text-text-secondary mt-1">{range(activeStreak)}</p>
              </>
            ) : (
              <>
                <p className="font-display italic font-extrabold text-3xl sm:text-4xl leading-[1.1] pr-2 text-text-main">{T.streak.noStreak}</p>
                <p className="text-sm text-text-secondary mt-1">{T.streak.noStreakSub}</p>
              </>
            )}
            {nudge && <p className="text-sm font-semibold text-accent mt-2">{nudge}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 lg:pl-10 lg:border-l lg:border-ink/[0.08] shrink-0">
          <IconTrendingUp className="w-7 h-7 text-accent shrink-0" aria-hidden="true" />
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">{T.streak.bestStreak}</p>
            {bestStreak ? (
              <>
                <p className="text-2xl font-extrabold tabular-nums text-text-main leading-tight">{plural(bestStreak.days, T.plurals.days, lang)}</p>
                <p className="text-xs text-text-secondary">{range(bestStreak)}</p>
              </>
            ) : (
              <p className="text-lg font-semibold text-text-secondary">—</p>
            )}
            <p className="text-xs text-text-secondary">
              {totalStreaks} {T.streak.totalStreaks.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
      {children && <div className="relative border-t border-ink/[0.06] pt-5">{children}</div>}
    </section>
  )
}
