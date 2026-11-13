'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { Streak } from '@/types/types'
import { SAMPLE_STREAKS, streaksEndingOn } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import StreakChart from '@/components/streak-page/streak-chart/StreakChart'
import Kicker from '@/components/ui/Kicker'
import { streakInk, streakTier } from '@/utils/streakTier'
import { formatDay, utcDay } from '@/utils/dates'
import { plural } from '@/utils/utils'

const AVERAGE = SAMPLE_STREAKS.reduce((sum, s) => sum + s.days, 0) / SAMPLE_STREAKS.length

/**
 * "See how you are doing", at its moment: the streak going on in big, in its tier's colour, with its dates,
 * and beside it the streak page's own list of the best streaks, grey but the one shown (the live one at
 * first; picking another shows it, picking it again lets go), as on `/racha`. An example, its dates moved so the
 * streak going on ends today (the UTC day, the same on the server and in the browser).
 */
export default function LandingStreak() {
  const { T, lang } = useLanguage()
  const [streaks] = useState(() => streaksEndingOn(utcDay(Date.now())))
  const LIVE = streaks[0]
  const [picked, setPicked] = useState<Streak | null>(LIVE)

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:items-center">
      <LandingSectionHead title={T.landing.progressTitle} text={T.landing.progressText} points={T.landing.progressPoints}>
        <p className="flex flex-col gap-2 mt-2 lg:mt-4">
          <span className="font-display italic font-extrabold text-[5rem] lg:text-[9.375rem] leading-[0.85] tabular-nums" style={{ color: streakInk(streakTier(LIVE.days)) }}>
            {plural(LIVE.days, T.plurals.days, lang)}
          </span>
          <span className="text-sm lg:text-base text-text-secondary">
            {T.streak.untilDay.replace('{start}', formatDay(LIVE.start, lang)).replace('{end}', formatDay(LIVE.end, lang))}
          </span>
        </p>
      </LandingSectionHead>
      {/* As tall as its row, and never less than the six streaks: the list fills its card (useFitCount). */}
      <div className="flex flex-col gap-3 min-h-[29rem] lg:self-stretch">
        <Kicker>{T.landing.example}</Kicker>
        <StreakChart
          streaks={streaks}
          selectedStreak={picked}
          activeStreak={LIVE}
          avgStreak={AVERAGE}
          onSelect={(s) => setPicked((p) => (p?.start === s.start ? null : s))}
        />
      </div>
    </section>
  )
}
