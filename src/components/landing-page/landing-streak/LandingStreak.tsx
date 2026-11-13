'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { streakDayCounts, streaksEndingOn } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import StreakCalendar from '@/components/streak-page/streak-calendar/StreakCalendar'
import Kicker from '@/components/ui/Kicker'
import Tag from '@/components/ui/Tag'
import { streakInk, streakTier } from '@/utils/streakTier'
import { formatDay, utcDay } from '@/utils/dates'
import { plural } from '@/utils/utils'

/**
 * "See how you are doing", the streak explained (canvas round 6, A, the owner's pick, 2026-11-13): the text says what a
 * streak is; the example shows the one going on, named and explained over its figure in its tier's colour, with its
 * dates, whether it is the best yet, and its days in `/racha`'s own calendar (pick a day to see its count). An example,
 * its dates moved so the streak ends today (the UTC day, the same on the server and in the browser). Half and half from
 * `xl`: the calendar's thirteen weeks need more than half of a 1024 px page.
 */
export default function LandingStreak() {
  const { T, lang } = useLanguage()
  const [today] = useState(() => utcDay(Date.now()))
  const [streaks] = useState(() => streaksEndingOn(today))
  const live = streaks[0]
  const [counts] = useState(() => streakDayCounts(live))
  const [picked, setPicked] = useState(today)
  const best = Math.max(...streaks.map((s) => s.days))

  return (
    <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:gap-16 xl:items-center">
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
                style={{ color: streakInk(streakTier(live.days)) }}
              >
                {plural(live.days, T.plurals.days, lang)}
              </span>
              <span className="text-sm text-text-secondary">{T.streak.untilToday.replace('{start}', formatDay(live.start, lang))}</span>
            </div>
            {live.days >= best && <Tag tone="accent">{T.streak.newRecord}</Tag>}
          </div>
          <StreakCalendar start={live.start} end={live.end} today={today} counts={counts} selected={picked} onSelect={setPicked} />
          <p aria-live="polite" className="text-sm text-text-secondary">
            <span className="font-semibold text-text-main">{formatDay(picked, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            {': '}
            {plural(counts[picked] ?? 0, T.plurals.achievements, lang)}
          </p>
        </div>
      </div>
    </section>
  )
}
