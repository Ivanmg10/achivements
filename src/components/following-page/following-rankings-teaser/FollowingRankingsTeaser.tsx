'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconChevronRight, IconTrophy, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRankings } from '@/hooks/useRankings'
import { slantStyle } from '@/components/ui/shape'

/** Second, first and third, as a podium stands: the picture's size and ring, the step's height and colour. */
const PODIUM = [
  { place: 2, avatar: 'w-11 h-11', ring: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(var(--ink)/0.4)]', step: 'h-9 bg-ink/20 text-text-main' },
  { place: 1, avatar: 'w-14 h-14', ring: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(250_204_21)]', step: 'h-14 bg-accent text-bg-main' },
  { place: 3, avatar: 'w-10 h-10', ring: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(var(--ink)/0.3)]', step: 'h-7 bg-ink/[0.14] text-text-main' },
]
const SLANT = slantStyle(8)

/**
 * The way into the rankings from Following: the podium of you and the people
 * you follow (all time, every platform) as the rankings page draws it, where
 * you stand among them, and the whole card a link to the page. An empty step
 * while nobody holds it.
 */
export default function FollowingRankingsTeaser({ className = '' }: { className?: string }) {
  const { T, lang } = useLanguage()
  const { data, rows } = useRankings({ scope: 'following', period: 'all', source: 'all' })
  const me = data?.me ?? null
  const ranked = Boolean(me && me.listed && data && data.total > 1)

  return (
    <Link
      href="/rankings"
      aria-labelledby="following-rankings-title"
      className={`enter-card [--i:3] group relative rounded-card overflow-hidden ring-1 ring-inset ring-ink/[0.06] p-5 flex flex-col gap-3 hover:ring-accent/50 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${className}`}
      style={{ background: 'radial-gradient(ellipse at 50% 100%, rgb(var(--accent) / 0.2), transparent 70%), rgb(var(--bg-card))' }}
    >
      <IconTrophy aria-hidden="true" size={150} stroke={1} className="absolute -right-6 -top-6 text-accent/[0.08] pointer-events-none" />

      <span className="relative flex items-center justify-between gap-2">
        <span id="following-rankings-title" className="flex items-center gap-2 font-bold">
          <span aria-hidden="true" className="w-8 h-8 rounded-tile bg-accent/15 text-accent ring-1 ring-accent/25 flex items-center justify-center">
            <IconTrophy size={16} />
          </span>
          {T.following.rankingsTitle}
          <span className="inline-flex items-center h-[1.375rem] px-2 rounded-tag text-xs font-bold bg-accent/15 text-accent">{T.rankings.beta}</span>
        </span>
        <span className="flex items-center gap-0.5 text-[0.8125rem] font-bold text-accent">
          {T.rankings.seeAll}
          <IconChevronRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>

      <span className="relative text-[0.8125rem] text-text-secondary">
        {ranked && me && data
          ? T.rankings.teaserRank.replace('{rank}', String(me.rank)).replace('{total}', String(data.total))
          : T.following.rankingsText}
      </span>

      <span aria-hidden="true" className="relative mt-auto pt-2 grid grid-cols-[1fr_1.15fr_1fr] items-end gap-2">
        {PODIUM.map(({ place, avatar, ring, step }) => {
          const row = rows[place - 1]
          return (
            <span key={place} className="flex flex-col items-center gap-1 min-w-0">
              {row?.avatar ? (
                <Image src={row.avatar} alt="" width={56} height={56} className={`${avatar} rounded-full object-cover bg-bg-main ${ring}`} unoptimized />
              ) : (
                <span className={`${avatar} rounded-full bg-bg-main flex items-center justify-center text-text-secondary ${ring}`}>
                  {row ? <IconUser size={16} /> : '?'}
                </span>
              )}
              <span className="w-full text-center truncate text-xs font-bold">{row ? (row.isMe ? T.rankings.you : row.username) : ' '}</span>
              <span className="text-[0.6875rem] font-semibold tabular-nums text-text-secondary">{row ? row.points.toLocaleString(lang) : ' '}</span>
              <span style={SLANT} className={`${step} w-full flex items-start justify-center pt-1 font-display italic font-extrabold text-xl leading-none tabular-nums`}>
                {place}
              </span>
            </span>
          )
        })}
      </span>
    </Link>
  )
}
