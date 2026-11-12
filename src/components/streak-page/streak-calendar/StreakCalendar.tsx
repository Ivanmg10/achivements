import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { daysBetween, formatDay } from '@/utils/dates'
import StreakCalendarDay from '../streak-calendar-day/StreakCalendarDay'

/**
 * The calendar's grid: the weekday initials, then a column per week of at most
 * 56 px that shrinks to 28 px before the grid scrolls sideways; a row for the
 * months over seven rows for the days. `w-fit`: as wide as its weeks, never
 * stretched.
 */
export const CALENDAR_GRID = 'grid w-fit gap-1.5 sm:gap-2 grid-rows-[auto_repeat(7,auto)]'
export const calendarColumns = (weeks: number) => ({ gridTemplateColumns: `auto repeat(${weeks}, minmax(1.75rem, 3.5rem))` })

// Mondays first; 2026-06-01 is a Monday, so these seven days name the rows.
export const WEEK = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']
const LEGEND = [0.3, 0.53, 0.77, 1]
const STEPS: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }

/**
 * A streak as a calendar: a column per week (Monday on top), a square per day
 * shaded by how many achievements it had, the month over the week it starts
 * in. Seven rows whatever the length: a long streak grows sideways. The picked
 * day is ringed and kept in view; the arrow keys move it a week (left, right)
 * or a day (up, down), Home and End to the first and last day.
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
  const scroller = useRef<HTMLDivElement>(null)
  const days = daysBetween(start, end)
  // Monday = 0 … Sunday = 6, so the first day lands in its own row.
  const lead = (new Date(`${start}T00:00:00`).getDay() + 6) % 7
  const weeks = Math.ceil((lead + days.length) / 7)
  const max = Math.max(1, ...days.map((d) => counts[d] ?? 0))
  // A month's name over the first week, and over each week a 1st falls in.
  const months = days.flatMap((day, i) =>
    i === 0 || day.endsWith('-01') ? [{ week: Math.floor((lead + i) / 7), day }] : [],
  ).filter((m, i, all) => all[i + 1]?.week !== m.week)

  // The picked day's week in view when the grid scrolls; only the scroller moves, never the page.
  useEffect(() => {
    const box = scroller.current
    const cell = box?.querySelector<HTMLElement>(`[data-day="${selected}"]`)
    if (!box || !cell || box.scrollWidth <= box.clientWidth) return
    box.scrollLeft = cell.offsetLeft - (box.clientWidth - cell.offsetWidth) / 2
  }, [selected])

  const onKeyDown = (e: KeyboardEvent) => {
    const at = days.indexOf(selected)
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? days.length - 1 : STEPS[e.key] !== undefined ? at + STEPS[e.key] : -1
    if (next < 0 || next >= days.length) return
    e.preventDefault()
    onSelect(days[next])
    scroller.current?.querySelector<HTMLButtonElement>(`[data-day="${days[next]}"]`)?.focus()
  }

  return (
    <div className="flex flex-col gap-2 min-w-0 max-w-full">
      {/* The days first: the entrance staggers the first children. */}
      <div ref={scroller} className="relative overflow-x-auto p-1 -m-1">
        <div role="group" aria-label={T.streak.calendarTitle} onKeyDown={onKeyDown} className={`${CALENDAR_GRID} enter-cards`} style={calendarColumns(weeks)}>
          {days.map((day, i) => (
            <StreakCalendarDay
              key={day}
              day={day}
              count={counts[day] ?? 0}
              heat={(counts[day] ?? 0) / max}
              selected={day === selected}
              isToday={day === today}
              style={{ gridRow: ((lead + i) % 7) + 2, gridColumn: Math.floor((lead + i) / 7) + 2 }}
              onSelect={onSelect}
            />
          ))}
          {months.map((m) => (
            <span key={m.day} aria-hidden="true" className="text-xs text-text-secondary whitespace-nowrap" style={{ gridRow: 1, gridColumn: m.week + 2 }}>
              {formatDay(m.day, lang, { month: 'short' })}
            </span>
          ))}
          {WEEK.map((d, i) => (
            <span key={d} aria-hidden="true" className="self-center pr-1 text-xs text-text-secondary" style={{ gridRow: i + 2, gridColumn: 1 }}>
              {formatDay(d, lang, { weekday: 'narrow' })}
            </span>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="flex items-center gap-1.5 text-[0.6875rem] text-text-secondary">
        {T.cards.heatLess}
        {LEGEND.map((a) => (
          <span key={a} className="w-3 h-3 rounded-cell" style={{ backgroundColor: `rgb(var(--accent) / ${a})` }} />
        ))}
        {T.cards.heatMore}
      </div>
    </div>
  )
}
