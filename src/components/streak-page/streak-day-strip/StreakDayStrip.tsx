import { useLanguage } from '@/context/LanguageContext'
import { daysBetween, formatDay, plural, stripCap } from '@/utils/utils'

// The tallest bar, in px; a day with nothing still shows a stub.
const HEIGHT = 120
const STUB = 4

/**
 * A streak day by day as a strip of bars, one per day, in order. Heights go by
 * the square root and stop at the 90th percentile, so a huge day does not
 * flatten the rest: such a day is cut (a slanted mark) and says its figure.
 * Picking a day shows what was unlocked on it.
 */
export default function StreakDayStrip({
  start,
  end,
  today,
  counts,
  selected,
  onSelect,
}: {
  start: string
  end: string
  /** Today, so the last day can say "today". */
  today?: string
  counts: Record<string, number>
  selected: string
  onSelect: (day: string) => void
}) {
  const { T, lang } = useLanguage()
  const days = daysBetween(start, end)
  const cap = stripCap(days.map((d) => counts[d] ?? 0))
  const short = (d: string) => formatDay(d, lang, { day: 'numeric', month: 'short' })

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="overflow-x-auto pb-1">
        <div role="group" aria-label={T.streak.calendarTitle} className="flex items-end gap-1 min-w-full" style={{ height: HEIGHT + 22 }}>
          {days.map((day) => {
            const n = counts[day] ?? 0
            const on = day === selected
            const cut = n > cap
            const h = n > 0 ? Math.max(STUB * 2, Math.round(Math.sqrt(Math.min(n, cap) / cap) * HEIGHT)) : STUB
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelect(day)}
                aria-pressed={on}
                aria-label={`${formatDay(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}: ${plural(n, T.plurals.achievements, lang)}`}
                title={`${short(day)} · ${plural(n, T.plurals.achievements, lang)}`}
                className="group relative flex-1 min-w-2.5 max-w-8 h-full flex flex-col justify-end items-center rounded-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {cut && (
                  <span aria-hidden="true" className={`text-[10px] font-bold tabular-nums mb-0.5 ${on ? 'text-accent' : 'text-text-secondary'}`}>
                    {n}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  data-cut={cut || undefined}
                  className={`relative w-full rounded-t-[3px] transition-[background-color,box-shadow] duration-(--motion-hover) ${
                    on ? 'bg-accent ring-2 ring-accent/40 ring-offset-2 ring-offset-bg-card' : n > 0 ? 'bg-accent/45 group-hover:bg-accent/70' : 'bg-ink/10'
                  }`}
                  style={{ height: h }}
                >
                  {cut && <span className="absolute left-0 right-0 top-2 h-[3px] bg-bg-card skew-y-(--slant-cut)" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div aria-hidden="true" className="flex justify-between text-[0.8125rem] text-text-secondary tabular-nums">
        <span>{short(start)}</span>
        {days.length > 6 && <span>{short(days[Math.floor(days.length / 2)])}</span>}
        <span>{end === today ? T.streak.today.toLowerCase() : short(end)}</span>
      </div>
    </div>
  )
}
