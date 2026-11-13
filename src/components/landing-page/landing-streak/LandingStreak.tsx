'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { streakCalendarDays, streaksEndingOn } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import LandingStreakCalendar from '@/components/landing-page/landing-streak-calendar/LandingStreakCalendar'
import Kicker from '@/components/ui/Kicker'
import { streakInk, streakTier } from '@/utils/streakTier'
import { formatDay, utcDay } from '@/utils/dates'
import { plural } from '@/utils/utils'

/**
 * "See how you are doing" (canvas round 6, A): the text says what a streak is; the example is one compact card, the
 * streak going on beside its days (the owner, 2026-11-13: smaller, no extras, no empty room on its right). On the left
 * "Your streak", its figure in its tier's colour, its dates and the day picked; on the right the landing's own calendar
 * (`LandingStreakCalendar`), as wide as the card leaves it. An example, its dates moved so the streak ends today (the
 * UTC day, the same on the server and in the browser).
 */
export default function LandingStreak() {
  const { T, lang } = useLanguage()
  const [today] = useState(() => utcDay(Date.now()))
  const [live] = useState(() => streaksEndingOn(today)[0])
  const [days] = useState(() => streakCalendarDays(live, today))
  const [picked, setPicked] = useState(today)
  const ink = streakInk(streakTier(live.days))
  const count = days.find((d) => d.day === picked)?.count ?? 0

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-18 lg:items-center">
      <LandingSectionHead title={T.landing.progressTitle} text={T.landing.progressText} points={T.landing.progressPoints} />
      <div className="min-w-0 flex flex-col gap-3">
        <Kicker>{T.landing.example}</Kicker>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8 bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-4 sm:p-6">
          <div className="flex flex-col gap-1.5 sm:w-44 shrink-0">
            <Kicker>{T.streak.yourStreak}</Kicker>
            <span className="font-display italic font-extrabold text-[3rem] leading-[0.9] tabular-nums" style={{ color: ink }}>
              {plural(live.days, T.plurals.days, lang)}
            </span>
            <span className="text-sm text-text-secondary">{T.streak.untilToday.replace('{start}', formatDay(live.start, lang))}</span>
            <p aria-live="polite" className="mt-3 text-sm text-text-secondary">
              <span className="font-semibold text-text-main">{formatDay(picked, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              {': '}
              {plural(count, T.plurals.achievements, lang)}
            </p>
          </div>
          <LandingStreakCalendar days={days} ink={ink} picked={picked} onPick={setPicked} />
        </div>
      </div>
    </section>
  )
}
