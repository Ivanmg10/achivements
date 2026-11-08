'use client'

import Link from 'next/link'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'

const SIZES = { sm: 32, md: 40, lg: 56, xl: 72, p1: 84, p2: 64, p3: 60 }

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
      {row.isMe && <Tag size="sm" tone="accent" className="ml-1.5 align-middle">{T.rankings.you}</Tag>}
    </span>
  )

  return (
    <span className={`flex min-w-0 gap-2.5 ${stacked ? 'flex-col items-center text-center' : 'items-center'}`}>
      <Avatar src={row.avatar} name={row.username} size={SIZES[size]} online={!row.isMe && row.online} announce ring={ring} />
      <span className={`flex flex-col gap-0.5 min-w-0 ${stacked ? 'items-center' : ''}`}>
        {linked ? (
          <Link
            href={`/user/${encodeURIComponent(row.username)}`}
            className="min-w-0 truncate hover:underline rounded focus-ring"
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
