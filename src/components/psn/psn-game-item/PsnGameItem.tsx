'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { IconChevronDown, IconClock } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnRecentlyPlayedExpanded from '@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import { useSpotlight } from '@/hooks/useSpotlight'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { formatDate } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { psnBackdrop } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'

/**
 * One PSN game as a compact row card — SteamGameItem's counterpart in the
 * recent feed. Icon and title open the game page; the rest of the card is
 * the button that expands its trophies, with play time where Sony reports
 * it (PS4/PS5 games).
 *
 * Expansion is controlled when `expanded`/`onToggle` are passed (the recent
 * feed shows one expanded game at a time), otherwise it is local.
 */
export default function PsnGameItem({
  game,
  expanded,
  onToggle,
  className = '',
}: {
  game: PsnGameProgress
  expanded?: boolean
  onToggle?: () => void
  className?: string
}) {
  const subject = useSubject()
  const { T, lang } = useLanguage()
  const [localExpanded, setLocalExpanded] = useState(false)
  const onPointerMove = useSpotlight()
  const panelId = useId()

  const isExpanded = expanded ?? localExpanded
  const toggle = onToggle ?? (() => setLocalExpanded((v) => !v))
  const href = gameHref('psn', game.id, subject)
  const perfect = game.pctWon >= 100

  return (
    <div
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-main rounded-card overflow-hidden flex flex-col min-h-0 ring-1 ring-ink/[0.04] ${className}`}
    >
      <GameCardBackdrop src={psnBackdrop(game)} />

      {/* relative: the expand button stretches over this whole row (see below). */}
      <div className="relative flex items-center gap-3.5 px-3.5 py-2 shrink-0">
        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
          <GameIcon
            source="psn"
            id={game.id}
            imageUrl={game.imageIcon}
            size={64}
            className={`rounded-tile w-14 h-14 sm:w-16 sm:h-16 shadow-[0_6px_18px_rgb(0_0_0/0.45)] transition-transform duration-300 hover:scale-105 ${
              perfect ? 'ring-2 ring-sky-300' : 'ring-1 ring-ink/10'
            }`}
          />
        </Link>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <span className="flex items-center gap-2 min-w-0">
            <Link
              href={href}
              className="relative z-10 w-fit max-w-full min-w-0 hover:underline underline-offset-2 decoration-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1] rounded"
            >
              <span className="text-[1.0625rem] font-extrabold block truncate leading-tight">{game.title}</span>
            </Link>
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-tag bg-black/35 text-text-main text-[0.6875rem] font-bold whitespace-nowrap shrink-0 max-w-[45%] truncate"><PlaystationLogo size={12} className="opacity-60" aria-hidden="true" />
                {game.consoleName}</span>
          </span>

          <button
            onClick={toggle}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={`${isExpanded ? T.psn.hideTrophies : T.psn.showTrophies}: ${game.title}`}
            className="flex flex-col gap-1 w-full text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1] group"
          >
            <span className="flex items-center gap-2 w-full">
              <ProgressBar pct={game.pctWon} label={game.title} className="flex-1" />
              <span className={`text-base font-extrabold tabular-nums shrink-0 w-[2.625rem] text-right ${perfect ? 'text-success' : 'text-text-main'}`}>
                {game.pctWon}%
              </span>
              <IconChevronDown
                size={14}
                aria-hidden="true"
                className={`ml-auto shrink-0 text-text-secondary/40 group-hover:text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </span>

            <span className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-text-secondary">
              <span className="whitespace-nowrap">
                {game.numAwarded}/{game.maxPossible} {T.psn.trophies.toLowerCase()}
              </span>
              {game.earned.platinum > 0 && (
                <>
                  <span className="opacity-40" aria-hidden="true">·</span>
                  <span className="text-sky-300">{T.psn.platinum}</span>
                </>
              )}
              {game.playtimeMinutes !== null && (
                <>
                  <span className="opacity-40" aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <IconClock size={12} aria-hidden="true" />
                    <span className="sr-only">{T.steam.playtime}: </span>
                    {formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
                  </span>
                </>
              )}
              {game.lastPlayed && (
                <>
                  <span className="opacity-40" aria-hidden="true">·</span>
                  <span>{formatDate(game.lastPlayed)}</span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Outside the expand button (a button inside a button is invalid HTML), and above its stretched hit area. */}
        <PinToggleButton gameId={game.id} source="psn" className="self-center relative z-10" />
      </div>

      {isExpanded && (
        <div id={panelId} className="flex-1 overflow-y-auto px-3 pb-3 pt-3 min-h-0 w-full">
          <PsnRecentlyPlayedExpanded game={game} />
        </div>
      )}
    </div>
  )
}
