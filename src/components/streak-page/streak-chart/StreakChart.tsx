'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'
import { decimal, formatDay, plural } from '@/utils/utils'
import StreakSectionHead from '../streak-section-head/StreakSectionHead'
import { slantStyle } from '@/components/ui/shape'

const MAX_ROWS = 6
const SLANT = slantStyle(6)

interface Props {
  streaks: Streak[]
  selectedStreak: Streak | null
  /** The streak going now, marked "ongoing". */
  activeStreak: Streak | null
  /** The average streak, in days, for the head. */
  avgStreak: number
  onSelect: (streak: Streak) => void
}

/**
 * The longest streaks as a ranked list: the place in the display face, a
 * slanted bar as long as the streak against the best (the one going now in
 * the accent, saying so), its dates under it and its days on the right.
 * Picking one shows it day by day.
 */
export default function StreakChart({ streaks, selectedStreak, activeStreak, avgStreak, onSelect }: Props) {
  const { T, lang } = useLanguage()
  const short = (d: string) => formatDay(d, lang, { day: 'numeric', month: 'short' })
  const top = streaks.slice(0, MAX_ROWS)
  const maxDays = top[0]?.days ?? 1
  const same = (a: Streak | null, b: Streak) => a?.start === b.start && a?.end === b.end

  return (
    <section aria-labelledby="streak-best-title" className="bg-bg-card rounded-[1.25rem] ring-1 ring-inset ring-ink/[0.06] p-5 sm:p-[1.375rem] flex flex-col gap-3 h-full">
      <StreakSectionHead
        id="streak-best-title"
        title={T.streak.chartTitle}
        aside={T.streak.bestSub.replace('{n}', String(streaks.length)).replace('{avg}', `${decimal(avgStreak, lang)} ${T.streak.daysUnit}`)}
      />

      <ol className="flex flex-col">
        {top.map((streak, i) => {
          const on = same(selectedStreak, streak)
          const live = same(activeStreak, streak)
          return (
            <li key={streak.start}>
              <button
                type="button"
                onClick={() => onSelect(streak)}
                aria-label={`${plural(streak.days, T.plurals.days, lang)}, ${short(streak.start)} – ${short(streak.end)}${live ? `, ${T.streak.ongoing}` : ''}`}
                aria-pressed={on}
                className={`w-full grid grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-3 px-2 py-1.5 rounded-control text-left transition-colors duration-(--motion-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                  on ? 'bg-ink/[0.05]' : 'hover:bg-ink/[0.04]'
                }`}
              >
                <span className={`font-display italic font-extrabold text-2xl tabular-nums ${live ? 'text-accent' : 'text-text-secondary'}`}>{i + 1}</span>
                <span className="flex flex-col gap-1 min-w-0">
                  <motion.span
                    aria-hidden="true"
                    className={`h-[1.375rem] flex items-center px-3 text-xs font-bold text-bg-main whitespace-nowrap overflow-hidden ${live ? 'bg-accent' : 'bg-accent/35'}`}
                    style={SLANT}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(12, (streak.days / maxDays) * 88)}%` }}
                    transition={{ duration: 0.45, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    {live && T.streak.ongoing}
                  </motion.span>
                  <span aria-hidden="true" className="text-[0.6875rem] text-text-secondary tabular-nums truncate">
                    {short(streak.start)} – {short(streak.end)}
                  </span>
                </span>
                <span aria-hidden="true" className="text-right text-lg font-extrabold tabular-nums">
                  {T.rankings.daysShort.replace('{n}', streak.days.toLocaleString(lang))}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
