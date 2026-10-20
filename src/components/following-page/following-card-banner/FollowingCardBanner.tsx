'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import type { FriendOverview, LastPlayed } from '@/utils/friends'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'
import { relativeTime } from '@/utils/utils'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import UserProfileBanner from '@/components/user-page/user-profile-banner/UserProfileBanner'

/**
 * The top of a Following card. Its backdrop is the last game played, blurred
 * (a store header a little, an icon blown up and a lot) — or, without one, the
 * person's avatar colours. Over it: that game and when.
 */
export default function FollowingCardBanner({ friend, lastPlayed }: { friend: FriendOverview; lastPlayed?: LastPlayed | null }) {
  const { T, lang } = useLanguage()
  const [failed, setFailed] = useState(false)
  const art = lastPlayed?.image && !failed ? lastPlayed.image : null

  return (
    <div className="relative h-24 rounded-t-2xl overflow-hidden">
      {art ? (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <Image
            src={art}
            alt=""
            fill
            unoptimized
            sizes="400px"
            onError={() => setFailed(true)}
            className={`object-cover saturate-150 opacity-60 ${lastPlayed!.wide ? 'scale-110 blur-lg' : 'scale-150 blur-2xl'}`}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-card/40 to-bg-card" />
        </div>
      ) : (
        <UserProfileBanner avatar={friend.avatar} />
      )}

      <div className="relative h-full p-2.5 flex items-start">
        {lastPlayed && (
          <Link
            href={gameHref(lastPlayed.source, lastPlayed.id, friend.username)}
            className="flex items-center gap-2 min-w-0 max-w-[75%] rounded-lg bg-bg-main/75 backdrop-blur-sm px-2 py-1 hover:bg-bg-main/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <PlatformLogo source={lastPlayed.source} size={12} label={PLATFORM_NAME[lastPlayed.source]} />
            <span className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary truncate">
                {T.following.lastPlayed} · {relativeTime(lastPlayed.at, lang)}
              </span>
              <span className="text-xs font-semibold text-text-main truncate">{lastPlayed.title}</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
