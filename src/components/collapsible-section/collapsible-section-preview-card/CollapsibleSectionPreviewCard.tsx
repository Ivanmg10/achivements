'use client'

import Image from 'next/image'
import Link from 'next/link'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import GameIcon from '@/components/game-icon/GameIcon'
import { gameHref } from '@/utils/gameRef'
import { steamAssetUrl } from '@/lib/steamAssets'
import { useSpotlight } from '@/hooks/useSpotlight'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import type { PreviewGame } from '@/utils/sectionPreview'
import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * One game in a folded section's preview: art, title, platform line and a
 * thin progress bar, linking to the game. Deliberately smaller than a list
 * card — a teaser, not the list.
 */
export default function CollapsibleSectionPreviewCard({ game, eager = false }: { game: PreviewGame; eager?: boolean }) {
  const onPointerMove = useSpotlight()
  const art =
    game.source === 'steam'
      ? steamAssetUrl(game.id, 'header')
      : game.source === 'psn' || game.source === 'xbox'
        ? game.imageRef || null
        : game.imageRef
          ? `https://retroachievements.org${game.imageRef}`
          : null

  return (
    <Link
      href={gameHref(game.source, game.id)}
      onPointerMove={onPointerMove}
      className="spotlight group flex items-center gap-3 rounded-card bg-bg-card p-2.5 pr-3 ring-1 ring-ink/5 hover:ring-ink/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 min-w-0 overflow-hidden"
    >
      <GameCardBackdrop src={art} surface="card" eager={eager} />
      {game.source === 'steam' ? (
        <SteamGameImage appId={game.id} asset="icon" iconUrl={game.imageRef} size={56} className="w-14 h-14 rounded-box shrink-0" />
      ) : game.source === 'psn' || game.source === 'xbox' ? (
        <GameIcon source={game.source} id={game.id} imageUrl={game.imageRef} size={56} className="w-14 h-14 rounded-box shrink-0" />
      ) : game.imageRef ? (
        <Image
          src={`https://retroachievements.org${game.imageRef}`}
          alt=""
          width={56}
          height={56}
          className="w-14 h-14 rounded-box object-cover shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-14 h-14 rounded-box bg-ink/10 shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-col min-w-0 flex-1 gap-1">
        <span className="text-sm font-semibold truncate group-hover:underline decoration-ink/40 underline-offset-2">
          {game.title}
        </span>
        <span className="text-xs text-text-secondary truncate">{game.subtitle}</span>
        {game.pct !== null && (
          <span className="flex items-center gap-2">
            <ProgressBar pct={game.pct} label={game.title} height="h-1" className="flex-1" />
            <span className={`text-[10px] tabular-nums ${game.pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{Math.round(game.pct)}%</span>
          </span>
        )}
      </div>
    </Link>
  )
}
