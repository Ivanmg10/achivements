'use client'

import { useLanguage } from '@/context/LanguageContext'

const HEIGHT = 56

/**
 * Points earned each of the last weeks, as bars in the theme's colour (this
 * week brighter). Plain SVG on purpose: a chart library is not worth its
 * weight for a dozen bars. Each bar says its week and points to screen
 * readers; the first and last weeks are labelled under it.
 */
export default function VaultWeeksChart({ weeks }: { weeks: { start: string; points: number }[] }) {
  const { T, lang } = useLanguage()
  if (weeks.length === 0) return null
  const max = Math.max(1, ...weeks.map((w) => w.points))
  const date = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const label = (w: { start: string; points: number }) => T.rankings.weeksBar.replace('{date}', date(w.start)).replace('{n}', w.points.toLocaleString(lang))

  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="text-xs font-semibold text-text-secondary">{T.rankings.weeksTitle}</figcaption>
      <ul className="flex items-end gap-1" style={{ height: HEIGHT }}>
        {weeks.map((w, i) => {
          const last = i === weeks.length - 1
          return (
            <li key={w.start} title={label(w)} className="flex-1 h-full flex items-end">
              <span className="sr-only">{label(w)}</span>
              <span
                aria-hidden="true"
                className={`w-full rounded-t-sm ${last ? 'bg-progress' : 'bg-progress/45'}`}
                style={{ height: w.points > 0 ? Math.max(3, (w.points / max) * HEIGHT) : 2, opacity: w.points > 0 ? 1 : 0.35 }}
              />
            </li>
          )
        })}
      </ul>
      <span aria-hidden="true" className="flex justify-between text-[10px] text-text-secondary tabular-nums">
        <span>{date(weeks[0].start)}</span>
        <span>{date(weeks[weeks.length - 1].start)}</span>
      </span>
    </figure>
  )
}
