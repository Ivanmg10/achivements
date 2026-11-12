import type { CSSProperties } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import { formatDay } from '@/utils/dates'

interface Props {
  day: string
  count: number
  /** How busy the day was against the streak's busiest one, 0 to 1. */
  heat: number
  selected: boolean
  isToday: boolean
  /** Its place in the calendar's grid. */
  style: CSSProperties
  onSelect: (day: string) => void
}

/**
 * One day of the streak calendar: its number, shaded in the accent by how
 * much was unlocked (as the year below it), ringed when picked. Only the
 * picked day is in the tab order; the calendar moves between days with the
 * arrow keys.
 */
export default function StreakCalendarDay({ day, count, heat, selected, isToday, style, onSelect }: Props) {
  const { T, lang } = useLanguage()
  const alpha = 0.3 + 0.7 * heat
  // On the strongest tints the number turns dark, as on an accent button.
  const ink = count > 0 && alpha > 0.6 ? 'text-bg-main' : 'text-text-main'
  const achievements = plural(count, T.plurals.achievements, lang)

  return (
    <button
      type="button"
      data-day={day}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(day)}
      aria-pressed={selected}
      aria-current={isToday ? 'date' : undefined}
      aria-label={`${formatDay(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}: ${achievements}`}
      title={achievements}
      className={`aspect-square w-full rounded-box flex items-center justify-center leading-none tabular-nums transition-shadow duration-(--motion-hover) focus-ring ${ink} ${
        selected ? 'ring-2 ring-text-main ring-offset-2 ring-offset-bg-card' : 'hover:ring-1 hover:ring-text-main/40'
      }`}
      style={{ ...style, backgroundColor: count > 0 ? `rgb(var(--accent) / ${alpha.toFixed(2)})` : 'rgb(var(--ink) / 0.06)' }}
    >
      <span className={`text-xs sm:text-[0.8125rem] ${selected ? 'font-extrabold' : 'font-semibold'}`}>{formatDay(day, lang, { day: 'numeric' })}</span>
    </button>
  )
}
