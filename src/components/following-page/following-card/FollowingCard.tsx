'use client'

import Link from 'next/link'
import { IconFolders } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { RecentAchievement } from '@/types/types'
import { recentAsBadge, type FriendOverview, type LastPlayed } from '@/utils/friends'
import { codeToFlag, findCountry } from '@/utils/countries'
import FollowingCardBanner from '../following-card-banner/FollowingCardBanner'
import FollowingCardBadges from '../following-card-badges/FollowingCardBadges'
import FollowingCardPlatforms from '../following-card-platforms/FollowingCardPlatforms'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import PresenceLabel from '@/components/presence-label/PresenceLabel'
import Kicker from '@/components/ui/Kicker'
import Avatar from '@/components/ui/Avatar'

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
    <article className="flex-1 bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] hover:ring-accent/60 transition-shadow flex flex-col min-w-0 overflow-hidden">
      <FollowingCardBanner friend={friend} lastPlayed={lastPlayed} />

      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        <div className="relative flex items-end gap-3 -mt-7 min-w-0">
          {/* The text below says it too: the dot is not the only sign. */}
            <Avatar src={friend.avatar} name={friend.username} size={60} fallback="icon" online={friend.online} ring="ring-4 ring-bg-card" />
          <div className="flex flex-col min-w-0 pb-0.5">
            <span className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/user/${encodeURIComponent(friend.username)}`}
                className="truncate text-[1.0625rem] font-extrabold hover:underline rounded focus-ring"
              >
                {friend.username}
              </Link>
              {country && (
                <span className="text-sm leading-none" role="img" aria-label={country.name}>
                  {codeToFlag(country.code)}
                </span>
              )}
              {friend.vaultPoints ? <VaultLevelBadge points={friend.vaultPoints} compact /> : null}
            </span>
            <PresenceLabel
              online={friend.online}
              lastSeenAt={friend.lastSeenAt}
              playing={friend.playing}
              fallback={friend.description && <span className="text-xs text-text-secondary truncate">{friend.description}</span>}
            />
          </div>
        </div>

        <FollowingCardPlatforms friend={friend} />

        {/* One sentence for every card with nothing to show: none earned, or not read (beyond the follows whose games are read), so it claims neither. */}
        <div className="flex flex-col gap-2">
          <Kicker>{T.following.recentUnlocks}</Kicker>
          {recent && recent.length > 0 ? (
            <FollowingCardBadges items={recent.slice(0, RECENT_MAX).map(recentAsBadge)} username={friend.username} label={T.following.recentUnlocks} />
          ) : (
            <p className="text-xs text-text-secondary italic">{T.following.noRecentUnlocks}</p>
          )}
        </div>

        {friend.showcase.length > 0 && (
          <div className="flex flex-col gap-2">
            <Kicker>{T.friends.showcase}</Kicker>
            <FollowingCardBadges items={friend.showcase} username={friend.username} label={T.friends.showcase} />
          </div>
        )}

        {friend.publicGroups > 0 && (
          <p className="mt-auto pt-3 border-t border-ink/[0.06] flex items-center justify-end gap-1 text-[0.6875rem] text-text-secondary">
            <IconFolders size={12} aria-hidden="true" />
            {T.friends.publicGroups.replace('{n}', friend.publicGroups.toLocaleString(lang))}
          </p>
        )}
      </div>
    </article>
  )
}
