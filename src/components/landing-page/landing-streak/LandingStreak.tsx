'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { streakCalendarDays, streaksEndingOn } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingStreakCalendar from '@/components/landing-page/landing-streak-calendar/LandingStreakCalendar'
import Kicker from '@/components/ui/Kicker'
import Tag from '@/components/ui/Tag'
import { streakInk, streakTier } from '@/utils/streakTier'
import { formatDay, utcDay } from '@/utils/dates'
import { plural } from '@/utils/utils'

/**
 * "See how you are doing", the streak explained (canvas round 6, A, the owner's pick, 2026-11-13): the text says what a
 * streak is; the example shows the one going on, named and explained over its figure in its tier's colour, with its
 * dates, whether it is the best yet, and its days in the landing's own calendar (`LandingStreakCalendar`: each day's
 * count in its square; pick a day to name it). An example,
 * its dates moved so the streak ends today (the UTC day, the same on the server and in the browser).
 */
export default function LandingStreak() {
  const { T, lang } = useLanguage()
  const [today] = useState(() => utcDay(Date.now()))
  const [streaks] = useState(() => streaksEndingOn(today))
  const live = streaks[0]
  const [days] = useState(() => streakCalendarDays(live, today))
  const [picked, setPicked] = useState(today)
  const best = Math.max(...streaks.map((s) => s.days))
  const ink = streakInk(streakTier(live.days))
  const count = days.find((d) => d.day === picked)?.count ?? 0

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:items-center">
      <LandingSectionHead title={T.landing.progressTitle} text={T.landing.progressText} points={T.landing.progressPoints} />
      <div className="min-w-0 flex flex-col gap-3">
        <Kicker>{T.landing.example}</Kicker>
        <div className="flex flex-col gap-6 bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <Kicker>{T.streak.yourStreak}</Kicker>
              <span className="text-sm text-text-secondary">{T.streak.pageSub}</span>
              <span
                className="mt-2 font-display italic font-extrabold text-[3.5rem] sm:text-[5rem] leading-[0.85] tabular-nums"
                style={{ color: ink }}
              >
                {plural(live.days, T.plurals.days, lang)}
              </span>
              <span className="text-sm text-text-secondary">{T.streak.untilToday.replace('{start}', formatDay(live.start, lang))}</span>
            </div>
            {live.days >= best && <Tag tone="accent">{T.streak.newRecord}</Tag>}
          </div>
          <LandingStreakCalendar days={days} ink={ink} picked={picked} onPick={setPicked} />
          <p aria-live="polite" className="text-sm text-text-secondary">
            <span className="font-semibold text-text-main">{formatDay(picked, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            {': '}
            {plural(count, T.plurals.achievements, lang)}
          </p>
        </div>
      </div>
    </section>
  )
}
