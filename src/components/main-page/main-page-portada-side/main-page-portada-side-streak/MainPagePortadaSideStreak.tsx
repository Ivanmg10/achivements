'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import { groupByDays, plural } from '@/utils/utils'
import { SURFACE } from '@/components/ui/surface'
import { streakInk, streakTier } from '@/utils/streakTier'
import { slantStyle } from '@/components/ui/shape'
import { PortadaStreakSkeleton } from '../../main-page-portada-skeleton/MainPagePortadaSkeleton'

/** How many days the bars show. */
const DAYS = 21
const SLANT = slantStyle(3)

/**
 * Your streak beside the cover: how long it is, the last three weeks as
 * slanted bars (a day with achievements lit, brighter the more it had), and
 * what today still needs. Opens the streak page. Nothing without a streak.
 */
export default function MainPagePortadaSideStreak() {
  const { T, lang } = useLanguage()
  const { achievements, activeStreak, bestStreak, now, isLoading } = useStreakData()
  if (isLoading && !activeStreak) return <PortadaStreakSkeleton />
  if (!activeStreak) return null

  const counts = groupByDays(achievements, DAYS, new Date(now)).map((d) => d.count)
  const max = Math.max(1, ...counts)
  const today = counts[DAYS - 1]
  const hoursLeft = 24 - new Date(now).getHours()
  const tier = streakTier(activeStreak.days)
  const record = bestStreak !== null && activeStreak.days >= bestStreak.days

  return (
    <Link
      href="/racha"
      className={`${SURFACE} p-5 flex flex-col gap-3 hover:ring-accent/40 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-bold" style={{ color: streakInk(tier) }}>{plural(activeStreak.days, T.plurals.streakOf, lang)}</span>
        {record && <span className="text-[0.8125rem] text-text-secondary">{T.streak.newRecord}</span>}
      </span>
      <span aria-hidden="true" className="flex gap-1 h-6">
        {counts.map((c, i) => (
          <span
            key={i}
            style={{ ...SLANT, opacity: c > 0 ? 0.45 + 0.55 * (c / max) : 1, ...(c > 0 ? { backgroundColor: `rgb(${tier.color})` } : {}) }}
            className={`flex-1 ${c > 0 ? '' : 'bg-ink/10'}`}
          />
        ))}
      </span>
      <span className="text-[0.8125rem] text-text-secondary">
        {today > 0 ? plural(today, T.plurals.todaySome, lang) : T.homeLayout.todayNone.replace('{h}', String(hoursLeft))}
      </span>
    </Link>
  )
}
