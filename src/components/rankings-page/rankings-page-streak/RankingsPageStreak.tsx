'use client'

import { IconFlame, IconFlameFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * A row's streaks: the current one in the accent (dimmed at 0) and the longest under it, in the
 * accent too while the current one is the record. Read aloud as one sentence; what is lit is also
 * said in numbers, not by colour alone.
 */
export default function RankingsPageStreak({ streak, best, className = '' }: { streak: number; best: number; className?: string }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)
  const label = T.rankings.streakLabel.replace('{n}', n(streak)).replace('{best}', n(best))
  const lit = streak > 0
  const record = lit && streak >= best
  const Flame = lit ? IconFlameFilled : IconFlame

  return (
    <span title={label} className={`inline-flex flex-col items-center gap-0.5 tabular-nums whitespace-nowrap ${className}`}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className={`inline-flex items-center gap-1 font-extrabold ${lit ? 'text-accent' : 'text-text-secondary'}`}>
        <Flame size={14} />
        {T.rankings.daysShort.replace('{n}', n(streak))}
      </span>
      {best > 0 && (
        <span aria-hidden="true" className={`text-[0.6875rem] ${record ? 'text-accent' : 'text-text-secondary'}`}>
          {T.rankings.bestShort.replace('{n}', n(best))}
        </span>
      )}
    </span>
  )
}
