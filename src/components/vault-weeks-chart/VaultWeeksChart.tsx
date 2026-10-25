'use client'

import { useLanguage } from '@/context/LanguageContext'

const HEIGHT = 70
const SLANT = { clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)' }

/**
 * Points earned each of the last weeks, as bars in the theme's colour (this
 * week brighter). Plain SVG on purpose: a chart library is not worth its
 * weight for a dozen bars. Each bar says its week and points to screen
 * readers.
 */
export default function VaultWeeksChart({ weeks, className = '' }: { weeks: { start: string; points: number }[]; className?: string }) {
  const { T, lang } = useLanguage()
  if (weeks.length === 0) return null
  const max = Math.max(1, ...weeks.map((w) => w.points))
  const date = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const label = (w: { start: string; points: number }) => T.rankings.weeksBar.replace('{date}', date(w.start)).replace('{n}', w.points.toLocaleString(lang))

  return (
    <figure className={`flex flex-col gap-1.5 ${className}`}>
      <figcaption className="sr-only">{T.rankings.weeksTitle}</figcaption>
      <ul className="flex items-end gap-1" style={{ height: HEIGHT }}>
        {weeks.map((w, i) => {
          const last = i === weeks.length - 1
          return (
            <li key={w.start} title={label(w)} className="flex-1 h-full flex items-end">
              <span className="sr-only">{label(w)}</span>
              <span
                aria-hidden="true"
                className={`w-full ${last ? 'bg-progress' : 'bg-progress/40'}`}
                style={{ ...SLANT, height: w.points > 0 ? Math.max(4, (w.points / max) * HEIGHT) : 2, opacity: w.points > 0 ? 1 : 0.35 }}
              />
            </li>
          )
        })}
      </ul>
    </figure>
  )
}
