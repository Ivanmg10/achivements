'use client'

import { useId } from 'react'
import Link from 'next/link'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameIcon from '@/components/game-icon/GameIcon'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import XboxLibraryDetail from '@/components/xbox/xbox-library-detail/XboxLibraryDetail'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import LibraryDetailRow from '@/components/library-detail-row/LibraryDetailRow'
import { useSpotlight } from '@/hooks/useSpotlight'
import { useExclusiveOpen } from '@/hooks/useExclusiveOpen'
import { gameHref } from '@/utils/gameRef'
import { xboxBackdrop, xboxPlatformChip } from '@/utils/xboxTitles'
import type { XboxGameProgress } from '@/types/xbox'

/**
 * An Xbox game on a category page, laid out like PsnStatusGameItem so the
 * lists read as one: 96px icon, title, chips, "x / y achievements", bar with %,
 * the gamerscore, the last session, and the badge grid when expanded. A game
 * at 100 % gets its chip, as a perfect Steam game does.
 *
 * Icon and title open the game page; everything else in the card is the
 * expand button.
 */
export default function XboxStatusGameItem({ game, category }: { game: XboxGameProgress; /** Which list it is in: what the opened card shows depends on it. */ category?: string }) {
  const { T, lang } = useLanguage()
  const [open, toggle] = useExclusiveOpen(`xbox:${game.id}`)
  const onPointerMove = useSpotlight()
  const panelId = useId()
  const href = gameHref('xbox', game.id)
  const isComplete = game.pctWon >= 100
  const progressText = game.totalKnown
    ? T.xbox.achievementsProgress.replace('{earned}', String(game.numAwarded)).replace('{total}', String(game.maxPossible))
    : T.xbox.achievementsEarned.replace('{earned}', String(game.numAwarded))

  return (
    <>
      <div
        onPointerMove={onPointerMove}
        className={`spotlight bg-bg-card rounded-2xl overflow-hidden transition-shadow duration-150 ${open ? 'ring-2 ring-accent/60' : 'ring-1 ring-ink/5 hover:ring-ink/15'}`}
      >
        <GameCardBackdrop src={xboxBackdrop(game)} surface="card" />
        {/* relative: the expand button stretches over this whole header (see the chevron). */}
        <div className="relative flex flex-row items-start gap-3 sm:gap-5 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
          {/* Same destination as the title link, so it is kept out of the tab order. */}
          <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
            <div
              className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden transition-all duration-150 ${
                isComplete ? 'ring-2 ring-green-500/70 hover:ring-green-500' : 'hover:ring-2 hover:ring-ink/40'
              }`}
            >
              <GameIcon source="xbox" id={game.id} imageUrl={game.imageIcon} size={96} className="w-16 h-16 sm:w-24 sm:h-24" />
            </div>
          </Link>

          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <Link
              href={href}
              className="relative z-10 self-start max-w-full min-w-0 hover:underline decoration-ink/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
            >
              <p title={game.title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">
                {game.title}
              </p>
            </Link>
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${xboxPlatformChip(game.consoleName)}`}>
                <XboxLogo size={12} aria-hidden="true" />
                {game.consoleName}
              </span>
              {isComplete && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  <span aria-hidden="true">★</span> {T.steam.perfect}
                </span>
              )}
            </span>
            <span className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>{progressText}</span>
            <span className="flex items-center gap-2 mt-1">
              <ProgressBar pct={game.pctWon} label={game.title} trackClass="bg-bg-main" className="flex-1" />
              <span className={`text-xs tabular-nums ${isComplete ? 'text-success font-semibold' : 'text-text-secondary'}`}>{game.pctWon}%</span>
            </span>
            <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="mt-1" />
            {game.lastPlayed && (
              <span className="text-xs text-text-secondary mt-1">
                {T.steam.lastPlayed} · {new Date(game.lastPlayed).toLocaleDateString(lang)}
              </span>
            )}
          </div>

          <span className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0 self-start sm:self-center -mr-2 sm:mr-0">
            <HideGameButton source="xbox" gameId={game.id} title={game.title} image={game.imageIcon} className="relative z-10" />
            <PinToggleButton gameId={game.id} source="xbox" className="relative z-10" />
            {/* The expand control: a real button, its hit area stretched over the whole header. */}
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? T.xbox.hideAchievements : T.xbox.showAchievements}: ${game.title}`}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-main cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <span aria-hidden="true" className="block text-xs transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>
          </span>
        </div>
      </div>
      <LibraryDetailRow open={open} id={panelId} title={game.title}>
        <XboxLibraryDetail game={game} category={category} />
      </LibraryDetailRow>
    </>
  )
}
