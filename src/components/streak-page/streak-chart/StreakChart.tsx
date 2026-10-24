'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'
import { formatDay, plural } from '@/utils/utils'

const MAX_ROWS = 10

interface Props {
  streaks: Streak[]
  selectedStreak: Streak | null
  onSelect: (streak: Streak) => void
}

/**
 * The longest streaks as a ranked list: place, length, a bar as long as the
 * streak against the best, and its dates. Picking one shows it day by day.
 */
export default function StreakChart({ streaks, selectedStreak, onSelect }: Props) {
  const { T, lang } = useLanguage()
  const short = (d: string) => formatDay(d, lang, { day: 'numeric', month: 'short', year: 'numeric' })
  const top = streaks.slice(0, MAX_ROWS)
  const maxDays = top[0]?.days ?? 1

  return (
    <section aria-labelledby="streak-best-title" className="bg-bg-card rounded-card p-5">
      <h2 id="streak-best-title" className="text-sm uppercase tracking-widest text-text-secondary mb-3">{T.streak.chartTitle}</h2>

      <ol className="flex flex-col">
        {top.map((streak, i) => {
          const on = selectedStreak?.start === streak.start && selectedStreak?.end === streak.end
          return (
            <li key={streak.start}>
              <button
                type="button"
                onClick={() => onSelect(streak)}
                aria-label={`${plural(streak.days, T.plurals.days, lang)}, ${short(streak.start)} – ${short(streak.end)}`}
                aria-pressed={on}
                className={`w-full grid grid-cols-[1.75rem_5.5rem_minmax(0,1fr)] sm:grid-cols-[1.75rem_5.5rem_minmax(0,1fr)_11rem] items-center gap-3 px-3 py-2 rounded-control text-left transition-colors duration-(--motion-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                  on ? 'bg-accent/12' : 'hover:bg-ink/[0.05]'
                }`}
              >
                <span className={`font-display italic font-extrabold text-lg tabular-nums ${on ? 'text-accent' : 'text-text-secondary'}`}>{i + 1}</span>
                <span className="text-sm font-bold tabular-nums text-text-main">{plural(streak.days, T.plurals.days, lang)}</span>
                <span aria-hidden="true" className="h-2 bg-ink/[0.07] [clip-path:polygon(4px_0,100%_0,calc(100%-4px)_100%,0_100%)]">
                  <motion.span
                    className={`block h-full ${on ? 'bg-accent' : 'bg-accent/45'}`}
                    style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(streak.days / maxDays) * 100}%` }}
                    transition={{ duration: 0.45, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </span>
                <span aria-hidden="true" className="hidden sm:block text-xs text-text-secondary tabular-nums text-right truncate">
                  {short(streak.start)} – {short(streak.end)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {streaks.length > MAX_ROWS && (
        <p className="text-xs text-text-secondary mt-3 text-center">
          {T.streak.topN.replace('{n}', String(MAX_ROWS))}
        </p>
      )}
    </section>
  )
}
