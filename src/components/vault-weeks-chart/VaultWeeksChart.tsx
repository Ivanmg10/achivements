'use client'

import { useLanguage } from '@/context/LanguageContext'
import DataBar from '@/components/ui/DataBar'
import Kicker from '@/components/ui/Kicker'
import { formatDay } from '@/utils/dates'

const HEIGHT = 70

/**
 * Points earned each of the last weeks, as bars in the theme's colour (this
 * week brighter), titled, with the week under each bar: the Monday's day, and
 * the month where it changes. Plain SVG on purpose: a chart library is not worth its
 * weight for a dozen bars. Each bar says its week and points to screen
 * readers.
 */
export default function VaultWeeksChart({ weeks, className = '' }: { weeks: { start: string; points: number }[]; className?: string }) {
  const { T, lang } = useLanguage()
  if (weeks.length === 0) return null
  const max = Math.max(1, ...weeks.map((w) => w.points))
  const label = (w: { start: string; points: number }) => T.rankings.weeksBar.replace('{date}', formatDay(w.start, lang)).replace('{n}', w.points.toLocaleString(lang))
  const month = (start: string) => start.slice(0, 7)

  return (
    <figure className={`flex flex-col gap-2 ${className}`}>
      <Kicker as="figcaption" size="sm" className="text-left">{T.rankings.weeksTitle}</Kicker>
      <ul className="flex gap-1">
        {weeks.map((w, i) => {
          const last = i === weeks.length - 1
          return (
            <li key={w.start} title={label(w)} className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="sr-only">{label(w)}</span>
              <span className="flex items-end" style={{ height: HEIGHT }}>
                <DataBar axis="y" share={w.points / max} min={w.points > 0 ? 4 : 2} tone={last ? 'accent' : 'soft'} style={{ opacity: w.points > 0 ? 1 : 0.35 }} className="w-full" />
              </span>
              <span aria-hidden="true" className="flex flex-col items-center text-[0.625rem] leading-tight tabular-nums text-text-secondary">
                {formatDay(w.start, lang, { day: 'numeric' })}
                <span className="h-3 max-w-full truncate">{i === 0 || month(w.start) !== month(weeks[i - 1].start) ? formatDay(w.start, lang, { month: 'short' }) : ''}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}
