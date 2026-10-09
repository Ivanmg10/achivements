'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/utils'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'
import type { PerfectGame } from '@/utils/perfectGames'
import GameIcon from '@/components/game-icon/GameIcon'
import PlatformMark from '@/components/platform-mark/PlatformMark'

/**
 * One game at 100% in the collection: its cover at 56px with the name under
 * it, so the grid reads without hovering (there is no hover on a phone).
 * A corner mark says hardcore, Steam or PlayStation; the date is read out to screen
 * readers, and the year heading above shows it to everyone else.
 */
export default function CollectionTile({ game, date }: { game: PerfectGame; date?: string }) {
  const { T } = useLanguage()
  const when = date ? (game.source === 'steam' ? T.cards.lastPlayedOn : T.cards.perfectOn).replace('{date}', formatDate(date)) : null

  return (
    <Link
      href={gameHref(game.source, game.id)}
      className="group flex flex-col items-center gap-1.5 min-w-0 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <span className="relative w-14 h-14 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5">
        <GameIcon source={game.source} id={game.id} imageUrl={game.imageUrl} size={56} className="w-14 h-14 rounded-lg ring-1 ring-ink/10" />
        {game.source === 'ra' ? (
          game.hardcore && <span aria-hidden="true" className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-warning border-2 border-bg-card" />
        ) : (
          <PlatformMark source={game.source} />
        )}
      </span>
      <span className="w-full text-center text-[11px] leading-tight text-text-secondary group-hover:text-text-main line-clamp-2 transition-colors">
        {game.title}
      </span>
      {when && <span className="sr-only">{`${game.source === 'ra' ? (game.hardcore ? 'Hardcore' : 'Softcore') : PLATFORM_NAME[game.source]}, ${when}`}</span>}
    </Link>
  )
}
