'use client'

import Link from 'next/link'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import { FadeImage } from '@/components/ui/FadeImage'
import PresenceDot from '@/components/presence-dot/PresenceDot'

const SIZES = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-18 h-18', p1: 'w-21 h-21', p2: 'w-16 h-16', p3: 'w-15 h-15' }
const DOT = { sm: 'xs', md: 'sm', lg: 'md', xl: 'md', p1: 'md', p2: 'md', p3: 'md' } as const
const INITIAL = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg', xl: 'text-2xl', p1: 'text-3xl', p2: 'text-2xl', p3: 'text-2xl' }

/**
 * Someone in the rankings: picture (with the green dot while they are online,
 * never on your own; a pulse while it loads, their initial without one or when
 * it fails, as an uploaded one does signed out), name, and "You" in words on your own row. The name
 * opens their profile (signed out, its public card: ProfileTeaser).
 */
export default function RankingsPageUser({
  row,
  size = 'sm',
  linked,
  stacked = false,
  ring = '',
  nameClass = 'font-semibold',
  children,
}: {
  row: Pick<RankRow, 'username' | 'avatar' | 'isMe' | 'online'>
  size?: keyof typeof SIZES
  /** Whether the name links to their profile. */
  linked: boolean
  /** Picture above the name (the podium) rather than beside it. */
  stacked?: boolean
  /** A ring round the picture (the podium's gold for the first). */
  ring?: string
  /** The name's size and weight. */
  nameClass?: string
  /** Whatever goes under the name (a level, a gap). */
  children?: React.ReactNode
}) {
  const { T } = useLanguage()
  const name = (
    <span className={`truncate ${nameClass}`}>
      {row.username}
      {row.isMe && <span className="ml-1.5 align-middle text-[10px] uppercase tracking-wider font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded-md">{T.rankings.you}</span>}
    </span>
  )

  const initial = (
    <span aria-hidden="true" className={`${SIZES[size]} ${INITIAL[size]} rounded-full bg-accent/15 text-accent font-bold ring-1 ring-accent/25 flex items-center justify-center select-none`}>
      {row.username.charAt(0).toUpperCase()}
    </span>
  )

  return (
    <span className={`flex min-w-0 gap-2.5 ${stacked ? 'flex-col items-center text-center' : 'items-center'}`}>
      <span className={`relative shrink-0 rounded-full ${ring}`}>
        {row.avatar ? (
          <FadeImage src={row.avatar} alt="" width={72} height={72} className={`${SIZES[size]} rounded-full`} fallback={initial} unoptimized />
        ) : (
          initial
        )}
        {!row.isMe && <PresenceDot online={row.online} size={DOT[size]} announce />}
      </span>
      <span className={`flex flex-col gap-0.5 min-w-0 ${stacked ? 'items-center' : ''}`}>
        {linked ? (
          <Link
            href={`/user/${encodeURIComponent(row.username)}`}
            className="min-w-0 truncate hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {name}
          </Link>
        ) : (
          name
        )}
        {children}
      </span>
    </span>
  )
}
