import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { Streak } from '@/types/types'
import { daysBetween, formatDay, plural } from '@/utils/utils'

const WEEKS = 53
const GAP = 3
/** Below this a day is too small to pick: the grid scrolls sideways instead. */
const MIN_CELL = 10

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The last year as a grid of days (a column per week, Monday on top), shaded
 * by achievements, with the picked streak outlined. Picking a played day opens
 * the streak it belongs to.
 */
export default function StreakYearHeatmap({
  byDay,
  streaks,
  selected,
  today,
  onSelect,
}: {
  byDay: Record<string, number>
  streaks: Streak[]
  selected: Streak | null
  today: string
  onSelect: (streak: Streak) => void
}) {
  const { T, lang } = useLanguage()

  const { columns, months, streakOf, max } = useMemo(() => {
    const end = new Date(`${today}T00:00:00`)
    const start = new Date(end)
    // Back to the Monday of the week 52 weeks ago, so the grid starts on a full column.
    start.setDate(start.getDate() - (WEEKS - 1) * 7 - ((end.getDay() + 6) % 7))
    const days = daysBetween(isoDay(start), today)
    const cols: string[][] = []
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7))
    // A month's name over the first column that starts in it.
    const labels: { col: number; label: string }[] = []
    cols.forEach((col, i) => {
      const first = col.find((d) => d.endsWith('-01') || (i === 0 && d === col[0]))
      if (first && (i === 0 || first.endsWith('-01'))) labels.push({ col: i, label: formatDay(first, lang, { month: 'short' }) })
    })
    const of = new Map<string, Streak>()
    for (const s of streaks) for (const d of daysBetween(s.start, s.end)) of.set(d, s)
    return { columns: cols, months: labels, streakOf: of, max: Math.max(1, ...Object.values(byDay)) }
  }, [byDay, streaks, today, lang])


  return (
    <section aria-labelledby="streak-year-title" className="bg-bg-card rounded-2xl p-5 flex flex-col gap-3 min-w-0">
      <div>
        <h2 id="streak-year-title" className="text-sm uppercase tracking-widest text-text-secondary">
          {T.streak.yearTitle}
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">{T.streak.yearHint}</p>
      </div>
      {/* Scrolls sideways on a narrow screen rather than shrinking the days to dots. */}
      <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
        {/* The days fill the card's width: one grid column per week, each day a square. */}
        <div className="relative" style={{ minWidth: columns.length * (MIN_CELL + GAP), paddingTop: 16 }}>
          {months.map((m) => (
            <span key={m.col} aria-hidden="true" className="absolute top-0 text-[10px] text-text-secondary" style={{ left: `${(m.col / columns.length) * 100}%` }}>
              {m.label}
            </span>
          ))}
          <div role="group" aria-label={T.streak.yearTitle} className="grid" style={{ gap: GAP, gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((col) => (
              <div key={col[0]} className="flex flex-col" style={{ gap: GAP }}>
                {col.map((day) => {
                  const n = byDay[day] ?? 0
                  const streak = streakOf.get(day)
                  const inSelected = !!selected && day >= selected.start && day <= selected.end
                  const style = {
                    aspectRatio: '1',
                    backgroundColor: n > 0 ? `rgb(var(--accent) / ${0.25 + 0.75 * (n / max)})` : 'rgb(var(--ink) / 0.06)',
                  }
                  const label = `${formatDay(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}: ${plural(n, T.plurals.achievements, lang)}`
                  return streak ? (
                    <button
                      key={day}
                      type="button"
                      onClick={() => onSelect(streak)}
                      aria-label={label}
                      title={label}
                      className={`w-full rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${inSelected ? 'ring-2 ring-text-main ring-offset-1 ring-offset-bg-card' : 'hover:ring-1 hover:ring-text-main/60'}`}
                      style={style}
                    />
                  ) : (
                    <span key={day} title={label} className="w-full rounded-[3px]" style={style} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
