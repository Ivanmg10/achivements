import { useLanguage } from '@/context/LanguageContext'
import { daysBetween, formatDay, plural } from '@/utils/utils'

// Mondays first; 2026-06-01 is a Monday, so these seven days name the columns.
const WEEK = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']

/**
 * A streak as a calendar: one square per day, Monday first, shaded by how
 * many achievements it had. Picking a day shows what was unlocked on it.
 * Days around the streak that fill out its first week are left blank.
 */
export default function StreakCalendar({
  start,
  end,
  counts,
  selected,
  onSelect,
}: {
  start: string
  end: string
  counts: Record<string, number>
  selected: string
  onSelect: (day: string) => void
}) {
  const { T, lang } = useLanguage()
  const days = daysBetween(start, end)
  // Monday = 0 … Sunday = 6, so the first day lands in its own column.
  const lead = (new Date(`${start}T00:00:00`).getDay() + 6) % 7
  const max = Math.max(1, ...days.map((d) => counts[d] ?? 0))

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {WEEK.map((d) => (
          <span key={d} className="text-[10px] uppercase tracking-wider text-text-secondary text-center">
            {formatDay(d, lang, { weekday: 'narrow' })}
          </span>
        ))}
      </div>
      <div role="group" aria-label={T.streak.calendarTitle} className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }).map((_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((day) => {
          const n = counts[day] ?? 0
          const isSelected = day === selected
          // At least a faint tint for a day in the streak, the busiest the strongest;
          // on the strongest tints the number turns dark, as on an accent button.
          const alpha = n > 0 ? 0.15 + 0.6 * (n / max) : 0.06
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={`${formatDay(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}: ${plural(n, T.plurals.achievements, lang)}`}
              title={plural(n, T.plurals.achievements, lang)}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold tabular-nums transition-[box-shadow,transform] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                isSelected ? 'ring-2 ring-accent' : ''
              } ${alpha > 0.5 ? 'text-bg-main' : 'text-text-main'}`}
              style={{ backgroundColor: `rgb(var(--accent) / ${alpha})` }}
            >
              {formatDay(day, lang, { day: 'numeric' })}
            </button>
          )
        })}
      </div>
    </div>
  )
}
