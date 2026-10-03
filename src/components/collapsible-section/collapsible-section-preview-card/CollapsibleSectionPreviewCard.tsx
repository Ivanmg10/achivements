'use client'

import Image from 'next/image'
import Link from 'next/link'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import { gameHref } from '@/utils/gameRef'
import { steamAssetUrl } from '@/lib/steamClient'
import { useSpotlight } from '@/hooks/useSpotlight'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import type { PreviewGame } from '@/utils/sectionPreview'

/**
 * One game in a folded section's preview: art, title, platform line and a
 * thin progress bar, linking to the game. Deliberately smaller than a list
 * card — a teaser, not the list.
 */
export default function CollapsibleSectionPreviewCard({ game, eager = false }: { game: PreviewGame; eager?: boolean }) {
  const done = game.pct !== null && game.pct >= 100
  const onPointerMove = useSpotlight()
  const art = game.source === 'steam' ? steamAssetUrl(game.id, 'header') : game.imageRef ? `https://retroachievements.org${game.imageRef}` : null
  const barColor = game.source === 'steam' ? (done ? 'bg-[#a4d007]' : 'bg-[#66c0f4]') : done ? 'bg-warning' : 'bg-accent'

  return (
    <Link
      href={gameHref(game.source, game.id)}
      onPointerMove={onPointerMove}
      className="spotlight group flex items-center gap-3 rounded-2xl bg-bg-card p-2.5 pr-3 ring-1 ring-ink/5 hover:ring-ink/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 min-w-0 overflow-hidden"
    >
      <GameCardBackdrop src={art} surface="card" eager={eager} />
      {game.source === 'steam' ? (
        <SteamGameImage appId={game.id} asset="icon" iconUrl={game.imageRef} size={56} className="w-14 h-14 rounded-lg shrink-0" />
      ) : game.imageRef ? (
        <Image
          src={`https://retroachievements.org${game.imageRef}`}
          alt=""
          width={56}
          height={56}
          className="w-14 h-14 rounded-lg object-cover shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-col min-w-0 flex-1 gap-1">
        <span className="text-sm font-semibold truncate group-hover:underline decoration-ink/40 underline-offset-2">
          {game.title}
        </span>
        <span className="text-xs text-text-secondary truncate">{game.subtitle}</span>
        {game.pct !== null && (
          <span className="flex items-center gap-2">
            <span
              role="progressbar"
              aria-label={game.title}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(game.pct)}
              className="relative h-1 flex-1 rounded-full bg-ink/10 overflow-hidden"
            >
              <span className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${game.pct}%` }} />
            </span>
            <span className="text-[10px] tabular-nums text-text-secondary/70">{Math.round(game.pct)}%</span>
          </span>
        )}
      </div>
    </Link>
  )
}
