'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'
import { formatDay, plural } from '@/utils/utils'

const MAX_BARS = 10
const BAR_HEIGHT = 160

interface Props {
  streaks: Streak[]
  selectedStreak: Streak | null
  onSelect: (streak: Streak) => void
}


export default function StreakChart({ streaks, selectedStreak, onSelect }: Props) {
  const { T, lang } = useLanguage()
  const short = (d: string) => formatDay(d, lang, { day: 'numeric', month: 'short' })
  const top = streaks.slice(0, MAX_BARS)
  const maxDays = top[0]?.days ?? 1

  return (
    <div className="bg-bg-card rounded-2xl p-5">
      <h2 className="text-sm uppercase tracking-widest text-text-secondary mb-6">{T.streak.chartTitle}</h2>

      <div className="flex items-end gap-2 sm:gap-3" style={{ height: BAR_HEIGHT + 56 }}>
        {top.map((streak, i) => {
          const isSelected = selectedStreak?.start === streak.start && selectedStreak?.end === streak.end
          const barH = Math.max(Math.round((streak.days / maxDays) * BAR_HEIGHT), 8)

          return (
            <button
              key={streak.start}
              onClick={() => onSelect(streak)}
              aria-label={`${plural(streak.days, T.plurals.days, lang)}, ${short(streak.start)} – ${short(streak.end)}`}
              aria-pressed={isSelected}
              className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {/* Day count label */}
              <motion.span
                className={`text-xs font-bold tabular-nums transition-colors ${isSelected ? 'text-accent' : 'text-text-secondary group-hover:text-text-main'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                {streak.days}
              </motion.span>

              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: BAR_HEIGHT }}>
                <motion.div
                  className={`w-full rounded-t-lg transition-opacity bg-accent ${isSelected ? 'shadow-[0_0_12px_2px_rgb(var(--accent)/0.35)]' : 'group-hover:opacity-80'}`}
                  // Unselected bars fade with length: the longest stand out without being picked.
                  style={isSelected ? undefined : { opacity: 0.2 + 0.4 * (streak.days / maxDays) }}
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>

              {/* Date range label */}
              {/* Too narrow on a phone for ten date pairs: the picked streak's dates are in the list below. */}
              <div aria-hidden="true" className={`hidden sm:flex flex-col items-center leading-tight w-full transition-colors ${isSelected ? 'text-text-main' : 'text-text-secondary'}`}>
                <span className="text-[10px] truncate w-full text-center">{short(streak.start)}</span>
                <span className="text-[10px] truncate w-full text-center">{short(streak.end)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {streaks.length > MAX_BARS && (
        <p className="text-xs text-text-secondary mt-3 text-center">
          {T.streak.topN.replace('{n}', String(MAX_BARS))}
        </p>
      )}
    </div>
  )
}
