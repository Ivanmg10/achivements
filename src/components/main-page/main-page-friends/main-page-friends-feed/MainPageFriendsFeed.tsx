'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconSparkles } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { FeedItem } from '@/utils/friends'
import { gameHref } from '@/utils/gameRef'
import { achievementBadgeUrl, relativeTime } from '@/utils/utils'
import EmptyState from '@/components/empty-state/EmptyState'

/** What the people you follow unlocked lately, all together and newest first; each opens their progress in that game. */
export default function MainPageFriendsFeed({ items }: { items: FeedItem[] }) {
  const { T, lang } = useLanguage()

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      <h3 className="text-[10px] uppercase tracking-widest text-text-secondary">{T.friends.feed}</h3>
      {items.length === 0 ? (
        // Centred in whatever height the card is given (it stretches to the column beside it).
        <EmptyState icon={<IconSparkles className="w-6 h-6" />} title={T.friends.feedEmpty} size="compact" className="py-6 flex-1 justify-center" />
      ) : (
        <ul className="flex flex-col gap-1 max-h-[26rem] xl:max-h-none xl:flex-1 xl:min-h-0 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgb(var(--accent)/0.35)_transparent] enter-rows">
          {items.map(({ username, achievement: a }) => {
            const badge = achievementBadgeUrl(a)
            return (
              <li key={`${username}:${a.Source ?? 'ra'}:${a.GameID}:${a.AchievementID}:${a.Date}`}>
                <Link
                  href={gameHref(a.Source ?? 'ra', a.GameID, username)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-box hover:bg-ink/[0.06] transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  {badge ? (
                    <Image src={badge} alt="" width={36} height={36} className="w-9 h-9 rounded-box-sm object-cover shrink-0" unoptimized />
                  ) : (
                    <span aria-hidden="true" className="w-9 h-9 rounded-box-sm bg-ink/10 shrink-0" />
                  )}
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold truncate">{a.Title}</span>
                    <span className="text-[11px] text-text-secondary truncate">
                      <span className="text-text-main">{username}</span> · {a.GameTitle}
                    </span>
                  </span>
                  <span className="text-[10px] text-text-secondary shrink-0">{relativeTime(a.Date.replace(' ', 'T') + 'Z', lang)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
