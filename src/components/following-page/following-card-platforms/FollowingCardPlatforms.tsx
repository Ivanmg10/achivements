'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { FriendOverview } from '@/utils/friends'
import { PLATFORM_NAME } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'

const PLATFORMS = ['ra', 'steam', 'psn', 'xbox'] as const

/**
 * Where someone plays: a chip per linked account with its logo and the name
 * it goes by there (as their public profile shows it), or the platform's
 * name when we do not have one.
 */
export default function FollowingCardPlatforms({ friend }: { friend: FriendOverview }) {
  const { T } = useLanguage()
  const linked = PLATFORMS.filter((p) => friend[p])
  if (linked.length === 0) return null

  return (
    <ul aria-label={T.userProfile.platformsLabel} className="flex flex-wrap gap-1.5">
      {linked.map((p) => {
        const name = friend.accounts?.[p]
        return (
          <li
            key={p}
            title={name ? `${PLATFORM_NAME[p]} · ${name}` : PLATFORM_NAME[p]}
            className="flex items-center gap-1.5 min-w-0 max-w-full rounded-full bg-bg-main ring-1 ring-ink/[0.06] pl-2 pr-2.5 py-1 text-[11px] font-medium"
          >
            <PlatformLogo source={p} size={12} label={PLATFORM_NAME[p]} />
            <span className="truncate">{name || PLATFORM_NAME[p]}</span>
          </li>
        )
      })}
    </ul>
  )
}
