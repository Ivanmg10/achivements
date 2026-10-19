'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconFolders, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { RecentAchievement } from '@/types/types'
import { recentAsBadge, type FriendOverview, type LastPlayed } from '@/utils/friends'
import { codeToFlag, findCountry } from '@/utils/countries'
import FollowingCardBanner from '../following-card-banner/FollowingCardBanner'
import FollowingCardBadges from '../following-card-badges/FollowingCardBadges'
import FollowingCardPlatforms from '../following-card-platforms/FollowingCardPlatforms'

const RECENT_MAX = 5

/**
 * Someone you follow: the last game they played across the top (or their
 * avatar's colours), who they are and where they play, their latest pinned
 * achievements as badges
 * and, small at the foot, what they earned last. `lastPlayed` and `recent` are
 * undefined while unknown (not read yet, or beyond the follows whose games are
 * read); `lastPlayed` is null when they have played nothing.
 */
export default function FollowingCard({
  friend,
  lastPlayed,
  recent,
}: {
  friend: FriendOverview
  lastPlayed?: LastPlayed | null
  recent?: RecentAchievement[]
}) {
  const { T, lang } = useLanguage()
  const country = friend.location ? findCountry(friend.location) : null

  return (
    <article className="flex-1 bg-bg-card rounded-2xl ring-1 ring-ink/5 hover:ring-accent/40 transition-shadow flex flex-col min-w-0">
      <FollowingCardBanner friend={friend} lastPlayed={lastPlayed} />

      <div className="px-4 pb-4 flex flex-col gap-4 flex-1">
        <div className="relative flex items-end gap-3 -mt-7 min-w-0">
          {friend.avatar ? (
            <Image src={friend.avatar} alt="" width={60} height={60} className="w-15 h-15 rounded-full object-cover shrink-0 bg-bg-main ring-4 ring-bg-card" unoptimized />
          ) : (
            <span aria-hidden="true" className="w-15 h-15 rounded-full bg-bg-main ring-4 ring-bg-card flex items-center justify-center shrink-0">
              <IconUser size={24} className="text-text-secondary" />
            </span>
          )}
          <div className="flex flex-col min-w-0 pb-0.5">
            <span className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/user/${encodeURIComponent(friend.username)}`}
                className="truncate text-base font-bold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {friend.username}
              </Link>
              {country && (
                <span className="text-sm leading-none" role="img" aria-label={country.name}>
                  {codeToFlag(country.code)}
                </span>
              )}
            </span>
            {friend.description && <span className="text-xs text-text-secondary truncate">{friend.description}</span>}
          </div>
        </div>

        <FollowingCardPlatforms friend={friend} />

        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.friends.pins}</p>
          {friend.pins.length === 0 ? (
            <p className="text-xs text-text-secondary italic">{T.friends.noPins}</p>
          ) : (
            <FollowingCardBadges items={friend.pins} username={friend.username} label={T.friends.pins} />
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-ink/5 flex items-center justify-between gap-2">
          {recent && recent.length > 0 ? (
            <FollowingCardBadges items={recent.slice(0, RECENT_MAX).map(recentAsBadge)} username={friend.username} label={T.following.recentUnlocks} size="sm" />
          ) : (
            <span />
          )}
          <p className="flex items-center gap-1 text-[11px] text-text-secondary shrink-0">
            <IconFolders size={12} aria-hidden="true" />
            {T.friends.publicGroups.replace('{n}', friend.publicGroups.toLocaleString(lang))}
          </p>
        </div>
      </div>
    </article>
  )
}
