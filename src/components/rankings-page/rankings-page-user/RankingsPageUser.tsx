'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconUser } from '@tabler/icons-react'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import PresenceDot from '@/components/presence-dot/PresenceDot'

const SIZES = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-18 h-18' }
const DOT = { sm: 'xs', md: 'sm', lg: 'md', xl: 'md' } as const

/**
 * Someone in the rankings: picture (with the green dot while they are online,
 * never on your own), name, and "You" in words on your own row. Signed in, the
 * name opens their profile; profiles need an account, so signed out it does not.
 */
export default function RankingsPageUser({
  row,
  size = 'sm',
  linked,
  stacked = false,
  children,
}: {
  row: Pick<RankRow, 'username' | 'avatar' | 'isMe' | 'online'>
  size?: keyof typeof SIZES
  /** Whether the name links to their profile. */
  linked: boolean
  /** Picture above the name (the podium) rather than beside it. */
  stacked?: boolean
  /** Whatever goes under the name (a level, a gap). */
  children?: React.ReactNode
}) {
  const { T } = useLanguage()
  const name = (
    <span className="truncate font-semibold">
      {row.username}
      {row.isMe && <span className="ml-1.5 align-middle text-[10px] uppercase tracking-wider font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded-md">{T.rankings.you}</span>}
    </span>
  )

  return (
    <span className={`flex min-w-0 gap-2.5 ${stacked ? 'flex-col items-center text-center' : 'items-center'}`}>
      <span className="relative shrink-0">
        {row.avatar ? (
          <Image src={row.avatar} alt="" width={72} height={72} className={`${SIZES[size]} rounded-full object-cover bg-bg-main`} unoptimized />
        ) : (
          <span aria-hidden="true" className={`${SIZES[size]} rounded-full bg-bg-main ring-1 ring-ink/10 flex items-center justify-center`}>
            <IconUser size={16} className="text-text-secondary" />
          </span>
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
