import { useRef, type KeyboardEvent } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { daysBetween, formatDay } from '@/utils/dates'
import StreakCalendarDay from '../streak-calendar-day/StreakCalendarDay'

/** Seven columns of at most 56 px: a long streak grows the calendar down, never wide; on a phone the days shrink to fit. */
export const CALENDAR_COLUMNS = 'grid grid-cols-[repeat(7,minmax(0,3.5rem))] gap-2'

// Mondays first; 2026-06-01 is a Monday, so these seven days name the columns.
const WEEK = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']
const LEGEND = [0.3, 0.53, 0.77, 1]
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }

/**
 * A streak as a calendar: a square per day, the week from Monday, shaded by
 * how many achievements it had. The picked day is ringed; the arrow keys move
 * the pick a day or a week, Home and End to the first and last day.
 */
export default function StreakCalendar({
  start,
  end,
  today,
  counts,
  selected,
  onSelect,
}: {
  start: string
  end: string
  today: string
  counts: Record<string, number>
  selected: string
  onSelect: (day: string) => void
}) {
  const { T, lang } = useLanguage()
  const grid = useRef<HTMLDivElement>(null)
  const days = daysBetween(start, end)
  // Monday = 0 … Sunday = 6, so the first day lands in its own column.
  const lead = (new Date(`${start}T00:00:00`).getDay() + 6) % 7
  const max = Math.max(1, ...days.map((d) => counts[d] ?? 0))

  const onKeyDown = (e: KeyboardEvent) => {
    const at = days.indexOf(selected)
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? days.length - 1 : STEPS[e.key] !== undefined ? at + STEPS[e.key] : -1
    if (next < 0 || next >= days.length) return
    e.preventDefault()
    onSelect(days[next])
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${days[next]}"]`)?.focus()
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-[27.5rem] shrink-0">
      <div aria-hidden="true" className={`${CALENDAR_COLUMNS} text-xs text-text-secondary text-center`}>
        {WEEK.map((d) => (
          <span key={d}>{formatDay(d, lang, { weekday: 'narrow' })}</span>
        ))}
      </div>
      <div ref={grid} role="group" aria-label={T.streak.calendarTitle} onKeyDown={onKeyDown} className={`${CALENDAR_COLUMNS} enter-cards`}>
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} aria-hidden="true" />
        ))}
        {days.map((day, i) => (
          <StreakCalendarDay
            key={day}
            day={day}
            count={counts[day] ?? 0}
            heat={(counts[day] ?? 0) / max}
            selected={day === selected}
            isToday={day === today}
            showMonth={i === 0 || day.endsWith('-01')}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div aria-hidden="true" className="flex items-center gap-1.5 mt-1 text-[0.6875rem] text-text-secondary">
        {T.cards.heatLess}
        {LEGEND.map((a) => (
          <span key={a} className="w-3 h-3 rounded-cell" style={{ backgroundColor: `rgb(var(--accent) / ${a})` }} />
        ))}
        {T.cards.heatMore}
      </div>
    </div>
  )
}
