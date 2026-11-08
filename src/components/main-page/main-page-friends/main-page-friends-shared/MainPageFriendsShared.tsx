'use client'

import Link from 'next/link'
import { IconArrowsDiff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { SharedGameRow } from '@/utils/friends'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'
import GameIcon from '@/components/game-icon/GameIcon'
import EmptyState from '@/components/empty-state/EmptyState'
import Kicker from '@/components/ui/Kicker'
import Avatar from '@/components/ui/Avatar'

/**
 * Your games that the people you follow play too, the most shared first: your
 * progress, then each of them with theirs, opening the two side by side.
 */
export default function MainPageFriendsShared({ rows }: { rows: SharedGameRow[] }) {
  const { T } = useLanguage()

  return (
    <div className="flex flex-col gap-3">
      <Kicker as="h3">{T.friends.shared}</Kicker>
      {rows.length === 0 ? (
        <EmptyState icon={<IconArrowsDiff className="w-6 h-6" />} title={T.friends.sharedEmpty} size="compact" className="py-6" />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 enter-rows">
          {rows.map(({ game, friends }) => (
            <li key={game.key} className="flex items-center gap-3 p-2.5 rounded-tile bg-bg-main min-w-0">
              <GameIcon source={game.source} id={game.id} imageUrl={game.iconUrl} size={44} className="w-11 h-11 rounded-box shrink-0" />
              <span className="flex flex-col gap-1.5 min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{game.title}</span>
                <span className="text-[11px] text-text-secondary">
                  {PLATFORM_NAME[game.source]} · {T.userProfile.you} {game.pct}%
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {friends.map((f) => (
                    <Link
                      key={f.username}
                      href={`${gameHref(game.source, game.id, f.username)}?compare=1`}
                      aria-label={`${T.friends.compareWith.replace('{u}', f.username)} (${f.pct}%)`}
                      title={`${f.username} · ${f.pct}%${f.online ? ` · ${T.following.online}` : ''}`}
                      className="flex items-center gap-1 rounded-full bg-bg-card pl-0.5 pr-2 py-0.5 text-[11px] tabular-nums hover:bg-ink/10 transition-colors focus-ring"
                    >
                      <Avatar src={f.avatar} name={f.username} size={20} fallback="icon" online={f.online} />
                      <span className={f.pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}>{f.pct}%</span>
                    </Link>
                  ))}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
