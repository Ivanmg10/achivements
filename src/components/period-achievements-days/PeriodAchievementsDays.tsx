'use client'

import { useRef, type KeyboardEvent } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useScrollFade } from '@/hooks/useScrollFade'
import { formatWeekdayDay } from '@/utils/dates'
import { plural } from '@/utils/utils'
import type { DayGroup } from '@/utils/periodDays'
import { TabMark } from '@/components/ui/Tabs'
import DataBar from '@/components/ui/DataBar'

/**
 * The left pane of the week and month dialogs: a row per day with an unlock, newest first, each with its weekday and
 * date, how many unlocks and an upright bar as long as its share of the busiest day. The chosen one carries the mark
 * (not only a tint). Up and down move between the days, Home and End go to the ends; a click or Enter chooses.
 */
export default function PeriodAchievementsDays({
  days,
  selected,
  onSelect,
}: {
  days: DayGroup[]
  selected: string
  onSelect: (date: string) => void
}) {
  const { T, lang } = useLanguage()
  const { ref, fade } = useScrollFade({ axis: 'y' })
  const list = useRef<HTMLUListElement>(null)
  const busiest = Math.max(1, ...days.map((d) => d.count))

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const rows = [...(list.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const at = rows.findIndex((b) => b === document.activeElement)
    const to = e.key === 'ArrowDown' ? at + 1 : e.key === 'ArrowUp' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? rows.length - 1 : null
    if (to === null || at < 0) return
    e.preventDefault()
    rows[Math.min(Math.max(to, 0), rows.length - 1)]?.focus()
  }

  return (
    <div ref={ref} className={`lg:overflow-y-auto lg:overscroll-contain lg:min-h-0 lg:flex-1 -mx-1 px-1 ${fade}`}>
      <ul ref={list} aria-label={T.dayModal.daysLabel} onKeyDown={onKeyDown} className="flex flex-col gap-1 enter-rows">
        {days.map((day) => {
          const on = day.date === selected
          return (
            <li key={day.date}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(day.date)}
                className={`w-full flex flex-col gap-1.5 px-3 py-2 rounded-tile text-left transition-colors focus-ring ${on ? 'bg-ink/[0.07]' : 'hover:bg-bg-card'}`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className={`flex items-center text-sm min-w-0 ${on ? 'font-semibold' : 'font-medium'}`}>
                    <TabMark on={on} keepRoom />
                    <span className="truncate">{formatWeekdayDay(day.date, lang)}</span>
                  </span>
                  <span className="text-xs text-text-secondary tabular-nums shrink-0">{plural(day.count, T.plurals.achievements, lang)}</span>
                </span>
                <DataBar share={day.count / busiest} track min={3} className="h-1.5" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
