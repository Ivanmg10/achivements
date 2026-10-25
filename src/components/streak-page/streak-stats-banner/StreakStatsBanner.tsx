'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'
import { formatDay, plural } from '@/utils/utils'

interface Props {
  activeStreak: Streak | null
  bestStreak: Streak | null
  /** The most recent day with an achievement, for when there is no streak going. */
  lastActiveDay: string | null
  /** Today, "YYYY-MM-DD", and how much was unlocked on it. */
  today: string
  todayCount: number
  /** Hours left in the day, for "what today still needs". */
  hoursLeft: number
  /** The year's numbers, as tiles on the right. */
  children?: React.ReactNode
}

/**
 * The top of the streak page, its one warm spot: the streak going now in big,
 * whether it is the record or how far from it, since when without missing a
 * day and what today has (or still needs); the year's numbers beside it.
 * Without a streak, when the last achievement was.
 */
export default function StreakStatsBanner({ activeStreak, bestStreak, lastActiveDay, today, todayCount, hoursLeft, children }: Props) {
  const { T, lang } = useLanguage()
  const long = (d: string) => formatDay(d, lang, { day: 'numeric', month: 'long' })

  let kicker = T.streak.yourStreak
  if (activeStreak && bestStreak) {
    kicker += ` · ${
      activeStreak.days >= bestStreak.days
        ? T.streak.newRecord
        : T.streak.toBeatRecord.replace('{days}', plural(bestStreak.days - activeStreak.days + 1, T.plurals.days, lang))
    }`
  }

  return (
    <section
      aria-label={T.streak.currentStreak}
      className="relative overflow-hidden rounded-[1.25rem] ring-1 ring-inset ring-ink/[0.06] bg-bg-card bg-[linear-gradient(110deg,rgb(var(--warning)/0.2),transparent_55%)] p-6 sm:p-[2.375rem] flex flex-col lg:flex-row lg:items-center gap-8"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-warning">{kicker}</p>
        {activeStreak ? (
          <>
            <p className="font-display italic font-extrabold text-6xl sm:text-[6.5rem] leading-[0.9] pr-3 text-text-main">
              {plural(activeStreak.days, T.plurals.days, lang)}
            </p>
            <p className="text-[0.9375rem] text-text-secondary">
              {(activeStreak.end === today ? T.streak.untilToday : T.streak.untilDay)
                .replace('{start}', long(activeStreak.start))
                .replace('{end}', long(activeStreak.end))}{' '}
              {todayCount > 0 ? plural(todayCount, T.plurals.todayAchievements, lang) : T.homeLayout.todayNone.replace('{h}', String(hoursLeft))}
            </p>
          </>
        ) : (
          <>
            <p className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[1] pr-2 text-text-main">{T.streak.noStreak}</p>
            <p className="text-[0.9375rem] text-text-secondary">
              {lastActiveDay ? T.streak.lastActive.replace('{date}', formatDay(lastActiveDay, lang, { weekday: 'long', day: 'numeric', month: 'long' })) : T.streak.noStreakSub}
            </p>
          </>
        )}
      </div>
      {children}
    </section>
  )
}
