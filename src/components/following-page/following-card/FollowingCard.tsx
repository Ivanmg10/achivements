'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconFolders, IconTrophy, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { RecentAchievement } from '@/types/types'
import { recentAsBadge, type FriendOverview, type LastPlayed } from '@/utils/friends'
import { codeToFlag, findCountry } from '@/utils/countries'
import FollowingCardBanner from '../following-card-banner/FollowingCardBanner'
import FollowingCardBadges from '../following-card-badges/FollowingCardBadges'
import FollowingCardPlatforms from '../following-card-platforms/FollowingCardPlatforms'
import PresenceDot from '@/components/presence-dot/PresenceDot'
import PresenceLabel from '@/components/presence-label/PresenceLabel'

const RECENT_MAX = 5

/**
 * Someone you follow: the last game they played across the top (or their
 * avatar's colours), who they are — online, or when they were last seen, in
 * place of their bio when they share it — and where they play; then what they
 * earned last, large, and small at the foot their achievement showcase. `lastPlayed` and `recent` are
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
          <span className="relative shrink-0">
            {friend.avatar ? (
              <Image src={friend.avatar} alt="" width={60} height={60} className="w-15 h-15 rounded-full object-cover bg-bg-main ring-4 ring-bg-card" unoptimized />
            ) : (
              <span aria-hidden="true" className="w-15 h-15 rounded-full bg-bg-main ring-4 ring-bg-card flex items-center justify-center">
                <IconUser size={24} className="text-text-secondary" />
              </span>
            )}
            {/* The text below says it too: the dot is not the only sign. */}
            <PresenceDot online={friend.online} />
          </span>
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
            <PresenceLabel
              online={friend.online}
              lastSeenAt={friend.lastSeenAt}
              fallback={friend.description && <span className="text-xs text-text-secondary truncate">{friend.description}</span>}
            />
          </div>
        </div>

        <FollowingCardPlatforms friend={friend} />

        {/* Not known yet (or beyond the follows whose games are read): nothing, rather than a wrong "none". */}
        {recent && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.following.recentUnlocks}</p>
            {recent.length === 0 ? (
              <p className="text-xs text-text-secondary italic">{T.following.noRecentUnlocks}</p>
            ) : (
              <FollowingCardBadges items={recent.slice(0, RECENT_MAX).map(recentAsBadge)} username={friend.username} label={T.following.recentUnlocks} />
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-ink/5 flex items-center justify-between gap-2">
          {friend.showcase.length > 0 ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <IconTrophy size={13} className="text-text-secondary shrink-0" aria-hidden="true" />
              <FollowingCardBadges items={friend.showcase} username={friend.username} label={T.friends.showcase} size="sm" />
            </div>
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
