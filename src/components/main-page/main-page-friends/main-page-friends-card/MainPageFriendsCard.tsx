'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconFolders, IconPin } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { FriendOverview } from '@/utils/friends'
import { candidateIconUrl } from '@/utils/gameCandidates'
import { gameHref } from '@/utils/gameRef'
import UserSummary from '@/components/user-summary/UserSummary'

/**
 * One person you follow, from our own data: who they are, their favourite
 * game on each platform, their three latest pinned achievements and how many public
 * groups they keep, with their unlocks this week once known.
 */
export default function MainPageFriendsCard({ friend, week }: { friend: FriendOverview; week: number | null }) {
  const { T, lang } = useLanguage()
  const favorites = (['ra', 'steam', 'psn', 'xbox'] as const)
    .map((source) => ({ source, game: friend.favorites?.[source] ?? null }))
    .filter((f) => f.game !== null)

  return (
    <article className="bg-bg-main rounded-xl p-3 flex flex-col gap-3 min-w-0">
      <Link
        href={`/user/${encodeURIComponent(friend.username)}`}
        className="flex items-center gap-3 rounded-lg -m-1 p-1 hover:bg-ink/[0.06] transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <UserSummary user={friend} size={40} />
      </Link>

      {favorites.length > 0 && (
        <ul aria-label={T.userProfile.favoriteGames} className="flex gap-1.5">
          {favorites.map(({ source, game }) => {
            const icon = candidateIconUrl({ source, imageRef: game!.imageIcon })
            return (
              <li key={source}>
                <Link
                  href={gameHref(source, game!.id, friend.username)}
                  title={game!.title}
                  aria-label={game!.title}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  {icon ? (
                    <Image src={icon} alt="" width={36} height={36} className="w-9 h-9 rounded-lg object-cover" unoptimized />
                  ) : (
                    <span aria-hidden="true" className="block w-9 h-9 rounded-lg bg-ink/10" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-secondary">
          <IconPin size={12} aria-hidden="true" />
          {T.friends.pins}
        </p>
        {friend.pins.length === 0 ? (
          <p className="text-xs text-text-secondary italic">{T.friends.noPins}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {friend.pins.slice(0, 3).map((p, i) => (
              <li key={`${p.source}:${p.gameId}:${i}`} className="flex items-center gap-2 min-w-0">
                {p.badge ? (
                  <Image src={p.badge} alt="" width={24} height={24} className="w-6 h-6 rounded object-cover shrink-0" unoptimized />
                ) : (
                  <span aria-hidden="true" className="w-6 h-6 rounded bg-ink/10 shrink-0" />
                )}
                <span className="text-xs truncate">
                  {p.title ?? '—'} <span className="text-text-secondary">· {p.gameTitle}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
        <span className="flex items-center gap-1">
          <IconFolders size={12} aria-hidden="true" />
          {T.friends.publicGroups.replace('{n}', friend.publicGroups.toLocaleString(lang))}
        </span>
        {week !== null && <span>{T.friends.weekUnlocks.replace('{n}', week.toLocaleString(lang))}</span>}
      </p>
    </article>
  )
}
