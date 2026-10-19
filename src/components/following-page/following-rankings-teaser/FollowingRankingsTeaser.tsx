'use client'

import { IconLock, IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** Second, first and third, as a podium stands. */
const PODIUM = [
  { place: 2, height: 'h-10' },
  { place: 1, height: 'h-14' },
  { place: 3, height: 'h-7' },
]

/**
 * Where the rankings will open from: they get a page of their own, and until
 * then this says they are coming, with a podium nobody stands on yet. When the
 * page exists, this card becomes its link.
 */
export default function FollowingRankingsTeaser({ className = '' }: { className?: string }) {
  const { T } = useLanguage()

  return (
    <section aria-labelledby="following-rankings-title" className={`relative bg-bg-card rounded-3xl overflow-hidden p-5 flex flex-col gap-4 ${className}`}>
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,rgb(var(--accent)/0.18),transparent_65%)]" />

      <div className="relative flex items-center justify-between gap-2">
        <h2 id="following-rankings-title" className="flex items-center gap-2 text-base font-semibold">
          <IconTrophy size={18} className="text-accent" aria-hidden="true" />
          {T.following.rankingsTitle}
        </h2>
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold bg-accent/15 text-accent px-2 py-0.5 rounded-full">
          <IconLock size={10} aria-hidden="true" />
          {T.following.rankingsSoon}
        </span>
      </div>

      <p className="relative text-xs text-text-secondary">{T.following.rankingsText}</p>

      <div aria-hidden="true" className="relative mt-auto flex items-end justify-center gap-2">
        {PODIUM.map(({ place, height }) => (
          <div key={place} className="flex flex-col items-center gap-1.5 w-14">
            <span className="w-8 h-8 rounded-full bg-bg-main ring-1 ring-ink/10 flex items-center justify-center text-sm font-bold text-text-secondary">?</span>
            <span className={`${height} w-full rounded-t-lg bg-linear-to-b from-accent/30 to-accent/5 flex items-start justify-center pt-1 text-xs font-bold text-accent tabular-nums`}>
              {place}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
