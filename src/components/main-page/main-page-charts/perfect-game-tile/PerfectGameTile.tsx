'use client'

import { useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/utils'
import type { PerfectGame } from '@/utils/perfectGames'
import SteamLogo from '@/components/steam-logo/SteamLogo'

/**
 * Tile side in px. Steam hands out its game icons at 32×32 and publishes no
 * bigger square: drawn any larger they are upscaled and look rough.
 */
const TILE = 32

/**
 * One game at 100%: its icon, a corner mark for hardcore or Steam, and on
 * hover or keyboard focus a tooltip with its name, platform and when it got
 * there. For Steam that is the last session, said as such, since Steam keeps
 * no completion date. The tooltip also describes the link to screen readers.
 */
export default function PerfectGameTile({ game, date }: { game: PerfectGame; date?: string }) {
  const { T } = useLanguage()
  const tipId = useId()
  const when = date ? (game.source === 'steam' ? T.cards.lastPlayedOn : T.cards.perfectOn).replace('{date}', formatDate(date)) : null

  return (
    <Link
      href={game.source === 'steam' ? `/steamGame/${game.id}` : `/gameInfo/${game.id}`}
      aria-label={game.title}
      aria-describedby={tipId}
      className="relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
    >
      {game.imageUrl ? (
        <Image
          src={game.imageUrl}
          alt=""
          width={TILE}
          height={TILE}
          className="rounded group-hover:scale-110 transition-transform"
          unoptimized={game.source === 'steam'}
        />
      ) : (
        <span className="block w-8 h-8 rounded bg-ink/10" aria-hidden="true" />
      )}
      {game.source === 'steam' ? (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-bg-card flex items-center justify-center" aria-hidden="true">
          <SteamLogo size={10} className="text-[#66c0f4]" />
        </span>
      ) : (
        game.hardcore && <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border border-bg-card" aria-hidden="true" />
      )}

      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-max max-w-56 rounded-lg bg-bg-header ring-1 ring-ink/10 shadow-xl shadow-black/40 px-2.5 py-1.5 text-left opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition duration-150"
      >
        <span className="block text-xs font-semibold text-text-main truncate">{game.title}</span>
        <span className="block text-[10px] text-text-secondary truncate">
          {game.subtitle}
          {game.source === 'ra' && ` · ${game.hardcore ? 'Hardcore' : 'Softcore'}`}
        </span>
        {when && <span className="block text-[10px] text-text-secondary">{when}</span>}
      </span>
    </Link>
  )
}
