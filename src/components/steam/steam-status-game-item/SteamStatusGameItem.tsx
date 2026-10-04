'use client'

import { useId, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { IconClock } from '@tabler/icons-react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamGameItemAchievements from '@/components/steam/steam-game-item/steam-game-item-achievements/SteamGameItemAchievements'
import { formatPlaytime } from '@/utils/steamFeed'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { useSpotlight } from '@/hooks/useSpotlight'
import { steamAssetUrl } from '@/lib/steamClient'
import type { SteamGameProgress } from '@/types/steam'

/**
 * A Steam game on a category page, laid out like RA's StatusGameItem so the
 * two lists read as one: 96px cover, title, chips, "x / y achievements", bar
 * with %, a detail line, last played, and the badge grid when expanded.
 *
 * Where RA shows points and a console, Steam shows playtime and a Steam chip;
 * RA's "Mastered" chip becomes "Perfect", in Steam's green.
 *
 * Cover and title open the game page; everything else in the card is the
 * expand button (RA's card is a clickable div — here it is a real button).
 * `itemRef`/`style` let a masonry list position it, as with RA cards.
 */
export default function SteamStatusGameItem({
  game,
  itemRef,
  style,
}: {
  game: SteamGameProgress
  itemRef?: (el: HTMLDivElement | null) => void
  style?: CSSProperties
}) {
  const { T, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const onPointerMove = useSpotlight()
  const panelId = useId()
  const href = `/steamGame/${game.id}`

  const hasCounts = game.achievementsLoaded && game.maxPossible > 0
  const isComplete = hasCounts && game.numAwarded >= game.maxPossible
  const playtime = formatPlaytime(
    game.playtimeForever,
    { minutes: T.steam.minutesShort, hours: T.steam.hoursShort },
    lang,
  )

  let progressText: string
  if (hasCounts) progressText = `${game.numAwarded} / ${game.maxPossible} ${T.steam.achievements}`
  else if (!game.hasStats) progressText = T.steam.noAchievements
  else progressText = T.steam.progressUnknown

  return (
    <div
      ref={itemRef}
      style={style}
      onPointerMove={onPointerMove}
      className="spotlight bg-bg-card rounded-2xl overflow-hidden ring-1 ring-ink/5 hover:ring-ink/15 transition-shadow duration-150"
    >
      {/* The same blurred art and pointer glow as the RA card beside it. */}
      <GameCardBackdrop src={steamAssetUrl(game.id, 'header')} surface="card" />
      {/* relative: the expand button stretches over this whole header (see the chevron). */}
      <div className="relative flex flex-row items-start gap-3 sm:gap-5 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
          <div
            className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden transition-all duration-150 ${
              isComplete ? 'ring-2 ring-[#a4d007]/70 hover:ring-[#a4d007]' : 'hover:ring-2 hover:ring-ink/40'
            }`}
          >
            <SteamGameImage appId={game.id} asset="icon" iconUrl={game.imageIcon} size={96} className="w-16 h-16 sm:w-24 sm:h-24 block" />
          </div>
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={href}
            className="relative z-10 self-start max-w-full min-w-0 hover:underline decoration-ink/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] rounded"
          >
            <p title={game.title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">{game.title}</p>
          </Link>
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#1b2838] text-[#66c0f4]">
              <SteamLogo size={12} aria-hidden="true" />
              Steam
            </span>
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#a4d007]/10 text-[#a4d007]">
                <span aria-hidden="true">★</span> {T.steam.perfect}
              </span>
            )}
          </span>
          <span className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>{progressText}</span>
          {hasCounts && (
            <span className="flex items-center gap-2 mt-1">
              <SteamProgressBar pct={game.pctWon} label={game.title} trackClass="bg-bg-main" className="flex-1" />
              <span className="text-xs text-text-secondary tabular-nums">{Math.round(game.pctWon)}%</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-text-secondary mt-1">
            <IconClock size={12} aria-hidden="true" />
            {T.steam.playtime} · {playtime}
          </span>
          <span className="text-xs text-text-secondary mt-1">
            {T.steam.lastPlayed} · {game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString(lang) : T.steam.neverPlayed}
          </span>
        </div>

        <span className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0 self-start sm:self-center -mr-2 sm:mr-0">
          <HideGameButton source="steam" gameId={game.id} title={game.title} image={steamAssetUrl(game.id, 'header')} className="relative z-10" />
          <PinToggleButton gameId={game.id} source="steam" className="relative z-10" />
          {/* The expand control: a real button, its hit area stretched over the whole header. */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? T.steam.hideAchievements : T.steam.showAchievements}: ${game.title}`}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-main cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
          >
            <span aria-hidden="true" className="block text-xs transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
        </span>
      </div>

      {open && (
        <div id={panelId} className="border-t border-bg-main px-4 py-4">
          {game.hasStats ? (
            <SteamGameItemAchievements
              appId={game.id}
              gameTitle={game.title}
              expectedCount={game.achievementsLoaded ? game.maxPossible : undefined}
              badgeSize={48}
              limit={60}
            />
          ) : (
            <p className="text-center text-text-secondary text-sm py-2">{T.steam.noAchievements}</p>
          )}
        </div>
      )}
    </div>
  )
}
