import type { CSSProperties } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { formatDay, plural } from '@/utils/utils'
import StreakSectionHead from '../streak-section-head/StreakSectionHead'
import { slantStyle } from '@/components/ui/shape'

// Mondays first; 2026-06-01 is a Monday.
const WEEK = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']
const BAR_HEIGHT = 120
const SLANT = slantStyle(8)

/** Achievements per day of the week, Monday first, as slanted bars; the busiest day in full accent. */
export default function StreakWeekdays({ counts }: { counts: number[] }) {
  const { T, lang } = useLanguage()
  const max = Math.max(1, ...counts)
  const top = counts.indexOf(Math.max(...counts))

  return (
    <section aria-labelledby="streak-weekdays-title" className="bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-5 sm:p-[1.375rem] flex flex-col gap-4 h-full">
      <StreakSectionHead id="streak-weekdays-title" title={T.streak.weekdaysTitle} aside={T.streak.weekdaysSub} />
      <ul className="flex items-end gap-2 flex-1" style={{ minHeight: BAR_HEIGHT + 40 }}>
        {counts.map((n, i) => (
          <li key={WEEK[i]} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className="text-sm font-extrabold tabular-nums text-text-main">{n.toLocaleString(lang)}</span>
            <div className="w-full flex items-end" style={{ height: BAR_HEIGHT }}>
              <div
                aria-hidden="true"
                className={`enter-grow-y w-full ${i === top ? 'bg-accent' : 'bg-accent/35'}`}
                style={{ ...SLANT, '--i': i, height: Math.max(4, Math.round((n / max) * BAR_HEIGHT)) } as CSSProperties}
              />
            </div>
            <span className="text-[0.8125rem] text-text-secondary">
              <span aria-hidden="true">{formatDay(WEEK[i], lang, { weekday: 'narrow' })}</span>
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
