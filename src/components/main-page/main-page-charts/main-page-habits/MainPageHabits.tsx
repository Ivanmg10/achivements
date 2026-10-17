'use client'

import { useMemo } from 'react'
import { IconClockHour4 } from '@tabler/icons-react'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { playHabits } from '@/utils/activityInsights'
import EmptyState from '@/components/empty-state/EmptyState'

const HOUR_MARKS = [0, 6, 12, 18]
/** A Monday, to name the weekdays in the app's language. */
const MONDAY = new Date(2026, 9, 12)
const hour = (h: number) => `${String(h % 24).padStart(2, '0')}:00`

/** One bar of the habits charts: its height against the tallest, the peak in full accent. */
function Bar({ count, max, peak, title }: { count: number; max: number; peak: boolean; title: string }) {
  return (
    <span title={title} className="flex-1 h-full flex items-end min-w-0">
      <span
        className={`w-full rounded-t-[3px] ${peak ? 'bg-accent' : 'bg-accent/30'}`}
        style={{ height: count > 0 ? `max(3px, ${(count / max) * 100}%)` : '0' }}
      />
    </span>
  )
}

/**
 * When the person plays: unlocks of the last year by weekday and by hour of
 * the day, in local time, as two bar charts with the busiest day and three
 * hours in full colour. The sentence on top says the same in words, so the
 * answer does not rest on reading the bars.
 */
export default function MainPageHabits({ achievements, isLoading }: { achievements: RecentAchievement[]; isLoading?: boolean }) {
  const { T, lang } = useLanguage()
  const habits = useMemo(() => playHabits(achievements), [achievements])
  const days = useMemo(() => {
    const short = new Intl.DateTimeFormat(lang, { weekday: 'short' })
    const long = new Intl.DateTimeFormat(lang, { weekday: 'long' })
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(MONDAY.getFullYear(), MONDAY.getMonth(), MONDAY.getDate() + i)
      return { short: short.format(d), long: long.format(d) }
    })
  }, [lang])

  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.habits}</p>
      <p className="text-[10px] text-text-secondary">{T.cards.habitsHint}</p>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <div aria-busy="true" className="h-40 rounded-lg bg-ink/5 animate-pulse" />
      </div>
    )
  }

  if (!habits.peak) {
    return (
      <div className="flex flex-col gap-2">
        {header}
        <EmptyState icon={<IconClockHour4 className="w-6 h-6" />} title={T.cards.noData} size="compact" className="py-2" />
      </div>
    )
  }

  const { day, fromHour } = habits.peak
  const dayMax = Math.max(...habits.byDay)
  const hourMax = Math.max(...habits.byHour)
  const inPeak = (h: number) => (h - fromHour + 24) % 24 < 3

  return (
    <div className="flex flex-col gap-3">
      {header}
      <p className="text-sm font-semibold">
        {T.cards.habitsPeak.replace('{day}', days[day].long).replace('{from}', hour(fromHour)).replace('{to}', hour(fromHour + 3))}
      </p>

      {/* The sentence above says what matters; the bars are its picture. */}
      <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-1 h-28">
            {habits.byDay.map((count, d) => (
              <Bar key={d} count={count} max={dayMax} peak={d === day} title={`${days[d].long} · ${count}`} />
            ))}
          </div>
          <div className="flex gap-1">
            {days.map((d, i) => (
              <span key={i} className={`flex-1 text-center text-[10px] capitalize whitespace-nowrap ${i === day ? 'text-text-main font-semibold' : 'text-text-secondary'}`}>
                {d.short}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-[3px] h-28">
            {habits.byHour.map((count, h) => (
              <Bar key={h} count={count} max={hourMax} peak={inPeak(h)} title={`${hour(h)} · ${count}`} />
            ))}
          </div>
          <div className="flex gap-[3px]">
            {habits.byHour.map((_, h) => (
              <span key={h} className="flex-1 text-[10px] text-text-secondary leading-none min-w-0">
                {HOUR_MARKS.includes(h) ? hour(h) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
