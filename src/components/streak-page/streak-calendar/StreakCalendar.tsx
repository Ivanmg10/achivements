import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { addDays, daysBetween, formatDay } from '@/utils/dates'
import StreakCalendarDay from '../streak-calendar-day/StreakCalendarDay'
import StreakCalendarNav from '../streak-calendar-nav/StreakCalendarNav'

/** From here the calendar shows 13 weeks of 40 px days; below, 7 weeks of 32 px. */
export const CALENDAR_WIDE = '(min-width: 640px)'
export const calendarWeeks = (wide: boolean) => (wide ? 13 : 7)

/**
 * The calendar's grid: the weekday initials, then a column per week; a row for
 * the months over seven rows for the days. `w-fit`: as wide as its weeks (a day
 * shrinks a little before it would overflow), the day panel takes the rest.
 */
export const CALENDAR_GRID = 'grid w-fit gap-1.5 grid-rows-[auto_repeat(7,auto)]'
export const calendarColumns = (weeks: number, wide: boolean) => ({
  gridTemplateColumns: `auto repeat(${weeks}, ${wide ? 'minmax(2rem, 2.5rem)' : 'minmax(1.75rem, 2rem)'})`,
})

// Mondays first; 2026-06-01 is a Monday, so these seven days name the rows.
export const WEEK = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']
const LEGEND = [0.3, 0.53, 0.77, 1]
const STEPS: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }

/**
 * A streak as a calendar: a column per week (Monday on top), a square per day
 * shaded by how many achievements it had, the month over its first week. A
 * fixed window of weeks, ending on the streak's last week; the buttons over it
 * page through a long streak, and a short one shows the weeks before it, their
 * days dimmed and not pickable, so the calendar keeps its size. The picked day
 * is ringed; the arrow keys move it a week (left, right) or a day (up, down),
 * Home and End to the first and last day, and the window follows.
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
  const wide = useMediaQuery(CALENDAR_WIDE)
  // How many weeks the window sits before the streak's end: 0 at first, and whatever the window's size.
  const [offset, setOffset] = useState(0)
  const grid = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<string | null>(null)

  const span = calendarWeeks(wide)
  const days = daysBetween(start, end)
  // Monday = 0 … Sunday = 6: the weeks count from the Monday before the first day.
  const lead = (new Date(`${start}T00:00:00`).getDay() + 6) % 7
  const monday = addDays(start, -lead)
  const weekOf = (i: number) => Math.floor((lead + i) / 7)
  const latest = weekOf(days.length - 1) - span + 1
  const earliest = Math.min(0, latest)
  const clamp = (week: number) => Math.min(latest, Math.max(earliest, week))
  const first = clamp(latest - offset)
  const goTo = (week: number) => setOffset(latest - clamp(week))

  const columns = Array.from({ length: span }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(monday, (first + w) * 7 + d)))
  const shown = columns.flat()
  const max = Math.max(1, ...days.map((d) => counts[d] ?? 0))
  const tabStop = shown.includes(selected) ? selected : (shown.find((d) => d >= start && d <= end) ?? selected)

  // A day picked from the keyboard may be drawn only once the window has moved: focus it then.
  useEffect(() => {
    if (!pendingFocus.current) return
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${pendingFocus.current}"]`)?.focus()
    pendingFocus.current = null
  }, [selected, first])

  const onKeyDown = (e: KeyboardEvent) => {
    const at = days.indexOf(selected)
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? days.length - 1 : STEPS[e.key] !== undefined ? at + STEPS[e.key] : -1
    if (next < 0 || next >= days.length) return
    e.preventDefault()
    const week = weekOf(next)
    if (week < first) goTo(week)
    else if (week > first + span - 1) goTo(week - span + 1)
    pendingFocus.current = days[next]
    onSelect(days[next])
  }

  return (
    <div className="flex flex-col gap-2 min-w-0 max-w-full">
      <StreakCalendarNav
        from={shown[0] > start ? shown[0] : start}
        to={shown[shown.length - 1] < end ? shown[shown.length - 1] : end}
        onPrev={first > earliest ? () => goTo(first - span) : null}
        onNext={first < latest ? () => goTo(first + span) : null}
      />
      {/* The days first: the entrance staggers the first children. */}
      <div ref={grid} role="group" aria-label={T.streak.calendarTitle} onKeyDown={onKeyDown} className={`${CALENDAR_GRID} enter-cards`} style={calendarColumns(span, wide)}>
        {shown.map((day, i) => {
          const place = { gridRow: (i % 7) + 2, gridColumn: Math.floor(i / 7) + 2 }
          if (day < start || day > end)
            return (
              <span key={day} aria-hidden="true" className="aspect-square w-full rounded-box flex items-center justify-center text-xs tabular-nums text-text-secondary/50 bg-ink/[0.03]" style={place}>
                {formatDay(day, lang, { day: 'numeric' })}
              </span>
            )
          return (
            <StreakCalendarDay
              key={day}
              day={day}
              count={counts[day] ?? 0}
              heat={(counts[day] ?? 0) / max}
              selected={day === selected}
              tabbable={day === tabStop}
              isToday={day === today}
              style={place}
              onSelect={onSelect}
            />
          )
        })}
        {columns.map((col, w) => {
          // The month over the week a 1st falls in, and over the first week shown.
          const named = col.find((d) => d.endsWith('-01')) ?? (w === 0 ? col[0] : null)
          return (
            named && (
              <span key={`m-${named}`} aria-hidden="true" className="text-xs text-text-secondary whitespace-nowrap" style={{ gridRow: 1, gridColumn: w + 2 }}>
                {formatDay(named, lang, { month: 'short' })}
              </span>
            )
          )
        })}
        {WEEK.map((d, i) => (
          <span key={`w-${d}`} aria-hidden="true" className="self-center pr-1 text-xs text-text-secondary" style={{ gridRow: i + 2, gridColumn: 1 }}>
            {formatDay(d, lang, { weekday: 'narrow' })}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className="h-4 flex items-center gap-1.5 text-[0.6875rem] text-text-secondary">
        {T.cards.heatLess}
        {LEGEND.map((a) => (
          <span key={a} className="w-3 h-3 rounded-cell" style={{ backgroundColor: `rgb(var(--accent) / ${a})` }} />
        ))}
        {T.cards.heatMore}
      </div>
    </div>
  )
}
