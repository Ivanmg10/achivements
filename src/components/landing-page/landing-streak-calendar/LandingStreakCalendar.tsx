'use client'

import { useRef, type KeyboardEvent } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { SampleCalendarDay } from '@/components/landing-page/landingSamples'
import { formatDay } from '@/utils/dates'
import { plural } from '@/utils/utils'

const STEPS: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }

/**
 * The landing's own streak calendar (the owner, 2026-11-13: not `/racha`'s, drawn for this page as on the canvas's A):
 * the weeks the streak spans, a column each, Monday on top, and in each day the number of achievements it had, not its
 * date, filled in the streak's tier colour (`ink`), stronger the busier the day. Days outside it are empty squares. A day
 * is a button (one tab stop, the arrows move a day or a week) that the line under the calendar names.
 */
export default function LandingStreakCalendar({
  days,
  ink,
  picked,
  onPick,
}: {
  days: SampleCalendarDay[]
  /** The streak's colour, a CSS colour. */
  ink: string
  picked: string
  onPick: (day: string) => void
}) {
  const { T, lang } = useLanguage()
  const grid = useRef<HTMLDivElement>(null)
  const weeks = days.length / 7
  const max = Math.max(1, ...days.map((d) => d.count ?? 0))
  const past = days.filter((d) => d.count !== null)

  const onKeyDown = (e: KeyboardEvent) => {
    const at = past.findIndex((d) => d.day === picked)
    const next = past[at + (STEPS[e.key] ?? NaN)]
    if (!next) return
    e.preventDefault()
    onPick(next.day)
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${next.day}"]`)?.focus()
  }

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div
        ref={grid}
        role="group"
        aria-label={T.streak.calendarTitle}
        onKeyDown={onKeyDown}
        className="grid gap-1 sm:gap-1.5 grid-rows-[auto_repeat(7,auto)]"
        style={{ gridTemplateColumns: `min-content repeat(${weeks}, minmax(0, 2.75rem))` }}
      >
        {Array.from({ length: weeks }, (_, w) => {
          const week = days.slice(w * 7, w * 7 + 7).map((d) => d.day)
          const named = week.find((d) => d.endsWith('-01')) ?? (w === 0 ? week[0] : null)
          return (
            named && (
              <span key={`m-${named}`} aria-hidden="true" className="text-xs text-text-secondary whitespace-nowrap" style={{ gridRow: 1, gridColumn: w + 2 }}>
                {formatDay(named, lang, { month: 'short' })}
              </span>
            )
          )
        })}
        {days.slice(0, 7).map((d, i) => (
          <span key={`w-${d.day}`} aria-hidden="true" className="self-center pr-1.5 text-xs text-text-secondary" style={{ gridRow: i + 2, gridColumn: 1 }}>
            {formatDay(d.day, lang, { weekday: 'narrow' })}
          </span>
        ))}
        {days.map((d, i) => {
          const place = { gridRow: (i % 7) + 2, gridColumn: Math.floor(i / 7) + 2 }
          if (d.count === null) return <span key={d.day} aria-hidden="true" className="aspect-square rounded-box ring-1 ring-inset ring-ink/[0.06]" style={place} />
          const heat = d.count / max
          const on = d.day === picked
          return (
            <button
              key={d.day}
              type="button"
              data-day={d.day}
              tabIndex={on ? 0 : -1}
              aria-pressed={on}
              aria-label={`${formatDay(d.day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}: ${plural(d.count, T.plurals.achievements, lang)}`}
              onClick={() => onPick(d.day)}
              className={`aspect-square rounded-box flex items-center justify-center text-xs sm:text-sm font-bold tabular-nums focus-ring transition-shadow duration-(--motion-hover) ${
                on ? 'ring-2 ring-text-main ring-offset-2 ring-offset-bg-card' : 'hover:ring-1 hover:ring-text-main/40'
              } ${heat > 0.55 ? 'text-bg-main' : 'text-text-main'}`}
              style={{ ...place, backgroundColor: `color-mix(in oklab, ${ink} ${Math.round(35 + 65 * heat)}%, transparent)` }}
            >
              {d.count}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-text-secondary">{T.landing.streakLegend}</p>
    </div>
  )
}
