'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { IconClock } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import PsnGameItemTrophies from '@/components/psn/psn-game-item-trophies/PsnGameItemTrophies'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import ExpandPanel from '@/components/expand-panel/ExpandPanel'
import { useSpotlight } from '@/hooks/useSpotlight'
import { gameHref } from '@/utils/gameRef'
import { psnBackdrop, psnPlatformChip } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'

/**
 * A PSN game on a category page, laid out like SteamStatusGameItem so the
 * lists read as one: 96px icon, title, chips, "x / y trophies", bar with %,
 * the trophies by grade, the last trophy, and the badge grid when expanded.
 * A platinum earned gets its chip, as a perfect Steam game does.
 *
 * Icon and title open the game page; everything else in the card is the
 * expand button.
 */
export default function PsnStatusGameItem({ game }: { game: PsnGameProgress }) {
  const { T, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const onPointerMove = useSpotlight()
  const panelId = useId()
  const href = gameHref('psn', game.id)
  const isComplete = game.pctWon >= 100
  const progressText = T.psn.trophiesProgress
    .replace('{earned}', String(game.numAwarded))
    .replace('{total}', String(game.maxPossible))

  return (
    <div
      onPointerMove={onPointerMove}
      className="spotlight bg-bg-card rounded-2xl overflow-hidden ring-1 ring-ink/5 hover:ring-ink/15 transition-shadow duration-150"
    >
      <GameCardBackdrop src={psnBackdrop(game)} surface="card" />
      {/* relative: the expand button stretches over this whole header (see the chevron). */}
      <div className="relative flex flex-row items-start gap-3 sm:gap-5 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
          <div
            className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden transition-all duration-150 ${
              isComplete ? 'ring-2 ring-sky-300/70 hover:ring-sky-300' : 'hover:ring-2 hover:ring-ink/40'
            }`}
          >
            <GameIcon source="psn" id={game.id} imageUrl={game.imageIcon} size={96} className="w-16 h-16 sm:w-24 sm:h-24" />
          </div>
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={href}
            className="relative z-10 self-start max-w-full min-w-0 hover:underline decoration-ink/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1] rounded"
          >
            <p title={game.title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">
              {game.title}
            </p>
          </Link>
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${psnPlatformChip(game.consoleName)}`}>
              <PlaystationLogo size={12} aria-hidden="true" />
              {game.consoleName}
            </span>
            {game.earned.platinum > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-300/10 text-sky-300">
                <span aria-hidden="true">★</span> {T.psn.platinum}
              </span>
            )}
          </span>
          <span className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>{progressText}</span>
          <span className="flex items-center gap-2 mt-1">
            <SteamProgressBar pct={game.pctWon} label={game.title} trackClass="bg-bg-main" className="flex-1" />
            <span className="text-xs text-text-secondary tabular-nums">{game.pctWon}%</span>
          </span>
          <PsnTrophyCounts earned={game.earned} of={game.defined} className="mt-1" />
          {game.playtimeMinutes !== null && (
            <span className="flex items-center gap-1 text-xs text-text-secondary mt-1">
              <IconClock size={12} aria-hidden="true" />
              {T.steam.playtime} · {formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
            </span>
          )}
          {game.lastPlayed && (
            <span className="text-xs text-text-secondary mt-1">
              {T.steam.lastPlayed} · {new Date(game.lastPlayed).toLocaleDateString(lang)}
            </span>
          )}
        </div>

        <span className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0 self-start sm:self-center -mr-2 sm:mr-0">
          <HideGameButton source="psn" gameId={game.id} title={game.title} image={game.imageIcon} className="relative z-10" />
          <PinToggleButton gameId={game.id} source="psn" className="relative z-10" />
          {/* The expand control: a real button, its hit area stretched over the whole header. */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? T.psn.hideTrophies : T.psn.showTrophies}: ${game.title}`}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-main cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1]"
          >
            <span aria-hidden="true" className="block text-xs transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
        </span>
      </div>

      <ExpandPanel open={open} id={panelId}>
        <div className="border-t border-bg-main px-4 py-4">
          <PsnGameItemTrophies gameId={game.id} titleId={game.titleId} gameTitle={game.title} expectedCount={game.maxPossible} badgeSize={48} limit={60} />
        </div>
      </ExpandPanel>
    </div>
  )
}
