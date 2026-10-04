import { useLanguage } from '@/context/LanguageContext'
import { formatDay, plural } from '@/utils/utils'

// Mondays first; 2026-06-01 is a Monday.
const WEEK = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']
const BAR_HEIGHT = 120

/** Achievements per day of the week, Monday first, the busiest day in full accent. */
export default function StreakWeekdays({ counts }: { counts: number[] }) {
  const { T, lang } = useLanguage()
  const max = Math.max(1, ...counts)
  const top = counts.indexOf(Math.max(...counts))

  return (
    <section aria-labelledby="streak-weekdays-title" className="bg-bg-card rounded-2xl p-5 flex flex-col gap-4 h-full">
      <div>
        <h2 id="streak-weekdays-title" className="text-sm uppercase tracking-widest text-text-secondary">
          {T.streak.weekdaysTitle}
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">{T.streak.weekdaysSub}</p>
      </div>
      <ul className="flex items-end gap-2 flex-1" style={{ minHeight: BAR_HEIGHT + 40 }}>
        {counts.map((n, i) => (
          <li key={WEEK[i]} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className={`text-xs font-bold tabular-nums ${i === top ? 'text-accent' : 'text-text-secondary'}`}>{n.toLocaleString(lang)}</span>
            <div className="w-full flex items-end" style={{ height: BAR_HEIGHT }}>
              <div
                aria-hidden="true"
                className="w-full rounded-t-md bg-accent"
                style={{ height: Math.max(4, Math.round((n / max) * BAR_HEIGHT)), opacity: i === top ? 1 : 0.25 + 0.45 * (n / max) }}
              />
            </div>
            <span className="text-[11px] text-text-secondary">
              <span aria-hidden="true">{formatDay(WEEK[i], lang, { weekday: 'short' })}</span>
              <span className="sr-only">
                {formatDay(WEEK[i], lang, { weekday: 'long' })}: {plural(n, T.plurals.achievements, lang)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
