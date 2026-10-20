'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconChevronRight, IconTrophy, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRankings } from '@/hooks/useRankings'

/** Second, first and third, as a podium stands. */
const PODIUM = [
  { place: 2, height: 'h-10' },
  { place: 1, height: 'h-14' },
  { place: 3, height: 'h-7' },
]

/**
 * The way into the rankings from Following: the podium of you and the people
 * you follow (all time, every platform), where you stand among them, and the
 * whole card a link to the page. An empty step while nobody holds it.
 */
export default function FollowingRankingsTeaser({ className = '' }: { className?: string }) {
  const { T, lang } = useLanguage()
  const { data, rows } = useRankings({ scope: 'following', period: 'all', source: 'all' })
  const me = data?.me ?? null

  return (
    <Link
      href="/rankings"
      aria-labelledby="following-rankings-title"
      className={`group relative bg-bg-card rounded-3xl overflow-hidden p-5 flex flex-col gap-4 hover:ring-1 hover:ring-accent/40 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${className}`}
    >
      <span aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,rgb(var(--accent)/0.18),transparent_65%)]" />

      <span className="relative flex items-center justify-between gap-2">
        <span id="following-rankings-title" className="flex items-center gap-2 text-base font-semibold">
          <IconTrophy size={18} className="text-accent" aria-hidden="true" />
          {T.following.rankingsTitle}
          <span className="text-[10px] uppercase tracking-wider font-bold bg-accent/15 text-accent px-2 py-0.5 rounded-full">{T.rankings.beta}</span>
        </span>
        <span className="flex items-center gap-0.5 text-xs font-medium text-accent">
          {T.rankings.seeAll}
          <IconChevronRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>

      <span className="relative text-xs text-text-secondary">
        {me && me.listed && data && data.total > 1
          ? T.rankings.teaserRank.replace('{rank}', String(me.rank)).replace('{total}', String(data.total))
          : T.following.rankingsText}
      </span>

      <span aria-hidden="true" className="relative mt-auto flex items-end justify-center gap-2">
        {PODIUM.map(({ place, height }) => {
          const row = rows[place - 1]
          return (
            <span key={place} className="flex flex-col items-center gap-1.5 w-16">
              {row?.avatar ? (
                <Image src={row.avatar} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover bg-bg-main" unoptimized />
              ) : (
                <span className="w-8 h-8 rounded-full bg-bg-main ring-1 ring-ink/10 flex items-center justify-center text-sm font-bold text-text-secondary">
                  {row ? <IconUser size={14} /> : '?'}
                </span>
              )}
              <span className="max-w-16 truncate text-[11px] text-text-secondary">{row ? (row.isMe ? T.rankings.you : row.username) : ''}</span>
              <span className={`${height} w-full rounded-t-lg bg-linear-to-b from-accent/30 to-accent/5 flex flex-col items-center pt-1 text-xs font-bold text-accent tabular-nums`}>
                {place}
                {row && <span className="text-[9px] font-semibold text-text-secondary">{row.points.toLocaleString(lang)}</span>}
              </span>
            </span>
          )
        })}
      </span>
    </Link>
  )
}
