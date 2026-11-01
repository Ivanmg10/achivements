import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { slantStyle } from '@/components/ui/shape'
import type { Streak } from '@/types/types'
import { daysBetween, formatDay, plural } from '@/utils/utils'
import StreakSectionHead from '../streak-section-head/StreakSectionHead'

const WEEKS = 53
const GAP = 3
/** Below this a day is too small to pick: the grid scrolls sideways instead. */
const MIN_CELL = 10

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The last year as a grid of days (a column per week, Monday on top), shaded
 * by achievements in the accent. With a streak picked only it keeps the accent,
 * the rest of the year goes grey and a rail over the grid spans its weeks, so
 * the choice is never colour alone. Picking a played day picks its streak.
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

  const firstCol = selected ? columns.findIndex((col) => col[col.length - 1] >= selected.start) : -1
  const lastCol = selected ? columns.findLastIndex((col) => col[0] <= selected.end) : -1
  const onGrid = firstCol !== -1 && firstCol <= lastCol

  return (
    <section aria-labelledby="streak-year-title" className="bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-5 sm:p-[1.375rem] flex flex-col gap-3 min-w-0">
      <StreakSectionHead
        id="streak-year-title"
        title={T.streak.yearTitle}
        aside={T.streak.yearSub.replace('{n}', Object.values(byDay).filter((n) => n > 0).length.toLocaleString(lang))}
      />
      <p className="sr-only">{T.streak.yearHint}</p>
      {/* Scrolls sideways on a narrow screen rather than shrinking the days to dots. */}
      <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
        {/* The days fill the card's width: one grid column per week, each day a square. */}
        <div className="relative px-1" style={{ minWidth: columns.length * (MIN_CELL + GAP), paddingTop: 22 }}>
          {months.map((m) => (
            <span key={m.col} aria-hidden="true" className="absolute top-0 text-[10px] text-text-secondary" style={{ left: `${(m.col / columns.length) * 100}%` }}>
              {m.label}
            </span>
          ))}
          {onGrid && (
            <span
              aria-hidden="true"
              className="absolute top-[0.9rem] h-[3px] bg-accent transition-[left,width] duration-(--motion-indicator) ease-(--enter-ease) motion-reduce:transition-none"
              style={{ ...slantStyle(3), left: `calc(0.25rem + (100% - 0.5rem) * ${firstCol / columns.length})`, width: `calc((100% - 0.5rem) * ${(lastCol - firstCol + 1) / columns.length} - ${GAP}px)` }}
            />
          )}
          <div role="group" aria-label={T.streak.yearTitle} className="grid" style={{ gap: GAP, gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((col) => (
              <div key={col[0]} className="flex flex-col" style={{ gap: GAP }}>
                {col.map((day) => {
                  const n = byDay[day] ?? 0
                  const streak = streakOf.get(day)
                  const inSelected = !!selected && day >= selected.start && day <= selected.end
                  const heat = n / max
                  const style = {
                    aspectRatio: '1',
                    backgroundColor: n === 0 ? 'rgb(var(--ink) / 0.06)' : !selected || inSelected ? `rgb(var(--accent) / ${0.3 + 0.7 * heat})` : `rgb(var(--ink) / ${0.1 + 0.2 * heat})`,
                  }
                  const label = `${formatDay(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}: ${plural(n, T.plurals.achievements, lang)}`
                  return streak ? (
                    <button
                      key={day}
                      type="button"
                      onClick={() => onSelect(streak)}
                      aria-label={label}
                      aria-pressed={inSelected}
                      title={label}
                      className="w-full rounded-cell transition-colors duration-(--motion-open) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 hover:ring-1 hover:ring-text-main/60"
                      style={style}
                    />
                  ) : (
                    <span key={day} title={label} className="w-full rounded-cell" style={style} />
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
