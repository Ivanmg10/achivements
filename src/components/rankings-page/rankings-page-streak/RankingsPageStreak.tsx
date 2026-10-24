'use client'

import { IconCrown, IconFlame, IconFlameFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * A row's streaks: the current one in a pill (lit while it runs, dimmed at 0) and the longest
 * beside it with a crown, gold while the current one is the record. Read aloud as one sentence;
 * what is lit is also said in numbers, not by colour alone.
 */
export default function RankingsPageStreak({ streak, best, className = '' }: { streak: number; best: number; className?: string }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)
  const label = T.rankings.streakLabel.replace('{n}', n(streak)).replace('{best}', n(best))
  const lit = streak > 0
  const record = lit && streak >= best
  const Flame = lit ? IconFlameFilled : IconFlame

  return (
    <span title={label} className={`inline-flex items-center gap-2 tabular-nums whitespace-nowrap ${className}`}>
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-1 h-6 pl-1.5 pr-2 rounded-full text-xs font-extrabold ${
          lit ? 'bg-accent/15 text-accent ring-1 ring-accent/30' : 'bg-ink/[0.05] text-text-secondary'
        }`}
      >
        <Flame size={13} className={lit ? 'text-accent' : ''} />
        {n(streak)}d
      </span>
      {best > 0 && (
        <span aria-hidden="true" className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${record ? 'text-accent' : 'text-text-secondary'}`}>
          <IconCrown size={12} />
          {n(best)}d
        </span>
      )}
    </span>
  )
}
