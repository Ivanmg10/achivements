'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'

const MAX_BARS = 10
const BAR_HEIGHT = 160

interface Props {
  streaks: Streak[]
  selectedStreak: Streak | null
  onSelect: (streak: Streak) => void
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('default', {
    day: 'numeric',
    month: 'short',
  })
}

export default function StreakChart({ streaks, selectedStreak, onSelect }: Props) {
  const { T } = useLanguage()
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
              aria-label={`${streak.days} ${T.streak.days} — ${formatDateShort(streak.start)}`}
              aria-pressed={isSelected}
              className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group focus-visible:outline-none"
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
                  className={`w-full rounded-t-lg transition-colors ${
                    isSelected
                      ? 'bg-accent shadow-[0_0_12px_2px_rgba(var(--accent),0.35)]'
                      : 'bg-accent/20 group-hover:bg-accent/40'
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>

              {/* Date range label */}
              <div className={`flex flex-col items-center leading-tight w-full transition-colors ${isSelected ? 'text-text-main' : 'text-text-secondary'}`}>
                <span className="text-[10px] truncate w-full text-center">{formatDateShort(streak.start)}</span>
                <span className="text-[10px] truncate w-full text-center opacity-60">{formatDateShort(streak.end)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {streaks.length > MAX_BARS && (
        <p className="text-xs text-text-secondary mt-3 text-center">
          Top {MAX_BARS} {T.streak.totalStreaks.toLowerCase()}
        </p>
      )}
    </div>
  )
}
