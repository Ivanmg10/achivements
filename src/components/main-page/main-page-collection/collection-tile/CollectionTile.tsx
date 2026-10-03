'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/utils'
import type { PerfectGame } from '@/utils/perfectGames'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamLogo from '@/components/steam-logo/SteamLogo'

/**
 * One game at 100% in the collection: its cover at 56px with the name under
 * it, so the grid reads without hovering (there is no hover on a phone).
 * A corner mark says hardcore or Steam; the date is read out to screen
 * readers, and the year heading above shows it to everyone else.
 */
export default function CollectionTile({ game, date }: { game: PerfectGame; date?: string }) {
  const { T } = useLanguage()
  const when = date ? (game.source === 'steam' ? T.cards.lastPlayedOn : T.cards.perfectOn).replace('{date}', formatDate(date)) : null

  return (
    <Link
      href={game.source === 'steam' ? `/steamGame/${game.id}` : `/gameInfo/${game.id}`}
      className="group flex flex-col items-center gap-1.5 min-w-0 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <span className="relative w-14 h-14 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5">
        {game.source === 'steam' ? (
          <SteamGameImage appId={game.id} asset="icon" iconUrl={game.imageUrl} size={56} className="w-14 h-14 rounded-lg ring-1 ring-white/10" />
        ) : game.imageUrl ? (
          <Image src={game.imageUrl} alt="" width={56} height={56} className="w-14 h-14 rounded-lg object-cover ring-1 ring-white/10" />
        ) : (
          <span aria-hidden="true" className="block w-14 h-14 rounded-lg bg-white/10" />
        )}
        {game.source === 'steam' ? (
          <span aria-hidden="true" className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-bg-card flex items-center justify-center">
            <SteamLogo size={11} className="text-[#66c0f4]" />
          </span>
        ) : (
          game.hardcore && <span aria-hidden="true" className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-warning border-2 border-bg-card" />
        )}
      </span>
      <span className="w-full text-center text-[11px] leading-tight text-text-secondary group-hover:text-text-main line-clamp-2 transition-colors">
        {game.title}
      </span>
      {when && <span className="sr-only">{`${game.source === 'ra' ? (game.hardcore ? 'Hardcore' : 'Softcore') : 'Steam'}, ${when}`}</span>}
    </Link>
  )
}
