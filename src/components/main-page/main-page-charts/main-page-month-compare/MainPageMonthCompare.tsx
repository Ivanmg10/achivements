'use client'

import { useMemo, useState } from 'react'
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@tabler/icons-react'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { compareMonths, type MonthNumbers } from '@/utils/activityInsights'

/**
 * This month so far against the same days of last month: achievements, games
 * played and active days, each with how far it moved. The arrow and the sign
 * say up or down, the colour only repeats it.
 */
export default function MainPageMonthCompare({ achievements, isLoading }: { achievements: RecentAchievement[]; isLoading?: boolean }) {
  const { T, lang } = useLanguage()
  // Read once: render has to give the same answer every time.
  const [now] = useState(() => new Date())
  const c = useMemo(() => compareMonths(achievements, now), [achievements, now])
  const range = useMemo(() => {
    const from = c.previousMonth
    const to = new Date(from.getFullYear(), from.getMonth(), c.throughDay)
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).formatRange(from, to)
  }, [c, lang])

  const tiles: { key: keyof MonthNumbers; label: string }[] = [
    { key: 'unlocks', label: T.cards.monthUnlocks },
    { key: 'games', label: T.cards.monthGames },
    { key: 'days', label: T.cards.monthDays },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.monthCompare}</p>
        <p className="text-[10px] text-text-secondary">{T.cards.monthVs.replace('{range}', range)}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map(({ key, label }) => {
          const value = c.current[key]
          const delta = value - c.previous[key]
          const Arrow = delta > 0 ? IconArrowUpRight : delta < 0 ? IconArrowDownRight : IconMinus
          const tone = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-text-secondary'
          return (
            <div key={key} className="flex flex-col gap-1 rounded-lg bg-bg-main px-2.5 sm:px-3 py-2.5 min-w-0">
              {/* Wraps rather than truncates: on a phone each of the three is ~90px wide. */}
              <dt className="text-[10px] uppercase tracking-wider leading-tight text-text-secondary break-words">{label}</dt>
              <dd className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xl font-bold tabular-nums">{isLoading ? '—' : value.toLocaleString(lang)}</span>
                {!isLoading && (
                  <span className={`flex items-center text-xs font-semibold tabular-nums ${tone}`}>
                    <Arrow size={14} aria-hidden="true" />
                    {delta > 0 ? `+${delta.toLocaleString(lang)}` : delta.toLocaleString(lang)}
                  </span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
