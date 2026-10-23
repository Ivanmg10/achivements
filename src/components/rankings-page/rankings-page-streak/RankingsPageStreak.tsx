'use client'

import { IconFlame } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** A row's current streak with a flame (lit while it runs) and, beside it, the longest one. Read aloud as one sentence. */
export default function RankingsPageStreak({ streak, best, className = '' }: { streak: number; best: number; className?: string }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)
  const label = T.rankings.streakLabel.replace('{n}', n(streak)).replace('{best}', n(best))

  return (
    <span title={label} className={`inline-flex items-center gap-1 tabular-nums whitespace-nowrap ${className}`}>
      <span className="sr-only">{label}</span>
      <IconFlame size={14} aria-hidden="true" className={streak > 0 ? 'text-orange-400' : 'text-text-secondary'} />
      <span aria-hidden="true" className="font-bold">{n(streak)}</span>
      <span aria-hidden="true" className="text-[11px] text-text-secondary">{T.rankings.streakBest.replace('{n}', n(best))}</span>
    </span>
  )
}
