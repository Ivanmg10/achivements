'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { IconChevronDown } from '@tabler/icons-react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameIcon from '@/components/game-icon/GameIcon'
import XboxRecentlyPlayedExpanded from '@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import { useSpotlight } from '@/hooks/useSpotlight'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { formatDate } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { xboxBackdrop } from '@/utils/xboxTitles'
import type { XboxGameProgress } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'

/**
 * One Xbox game as a compact row card — PsnGameItem's counterpart in the
 * recent feed. Icon and title open the game page; the rest of the card is the
 * button that expands its achievements.
 *
 * Expansion is controlled when `expanded`/`onToggle` are passed (the recent
 * feed shows one expanded game at a time), otherwise it is local.
 */
export default function XboxGameItem({
  game,
  expanded,
  onToggle,
  className = '',
}: {
  game: XboxGameProgress
  expanded?: boolean
  onToggle?: () => void
  className?: string
}) {
  const subject = useSubject()
  const { T } = useLanguage()
  const [localExpanded, setLocalExpanded] = useState(false)
  const onPointerMove = useSpotlight()
  const panelId = useId()

  const isExpanded = expanded ?? localExpanded
  const toggle = onToggle ?? (() => setLocalExpanded((v) => !v))
  const href = gameHref('xbox', game.id, subject)
  const perfect = game.pctWon >= 100
  const progressText = game.totalKnown
    ? T.xbox.achievementsProgress.replace('{earned}', String(game.numAwarded)).replace('{total}', String(game.maxPossible))
    : T.xbox.achievementsEarned.replace('{earned}', String(game.numAwarded))

  return (
    <div
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-main rounded-2xl overflow-hidden flex flex-col min-h-0 ring-1 ring-ink/[0.04] ${className}`}
    >
      <GameCardBackdrop src={xboxBackdrop(game)} />

      {/* relative: the expand button stretches over this whole row (see below). */}
      <div className="relative flex items-center gap-3 px-3 py-3 shrink-0">
        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
          <GameIcon
            source="xbox"
            id={game.id}
            imageUrl={game.imageIcon}
            size={64}
            className={`rounded-xl w-14 h-14 sm:w-16 sm:h-16 shadow-md shadow-black/30 transition-transform duration-300 hover:scale-105 ${
              perfect ? 'ring-2 ring-green-500' : 'ring-1 ring-ink/10'
            }`}
          />
        </Link>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Link
            href={href}
            className="relative z-10 w-fit max-w-full hover:underline underline-offset-2 decoration-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
          >
            <span className="text-base font-bold block truncate leading-tight">{game.title}</span>
          </Link>

          <button
            onClick={toggle}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={`${isExpanded ? T.xbox.hideAchievements : T.xbox.showAchievements}: ${game.title}`}
            className="flex flex-col gap-1 w-full text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 group"
          >
            <span className="flex items-center gap-2 w-full">
              <span className="flex items-center gap-1 shrink-0 text-xs text-text-secondary">
                <XboxLogo size={12} className="opacity-60" aria-hidden="true" />
                {game.consoleName}
              </span>
              <ProgressBar pct={game.pctWon} label={game.title} className="flex-1" />
              <span className={`text-xs font-semibold tabular-nums shrink-0 ${perfect ? 'text-success' : 'text-text-main'}`}>
                {game.pctWon}%
              </span>
              <IconChevronDown
                size={14}
                aria-hidden="true"
                className={`ml-auto shrink-0 text-text-secondary/40 group-hover:text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </span>

            <span className="flex flex-wrap items-center gap-x-2 text-xs text-text-secondary">
              <span className="whitespace-nowrap">{progressText}</span>
              <span className="opacity-40" aria-hidden="true">·</span>
              <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} />
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
        <PinToggleButton gameId={game.id} source="xbox" className="self-center relative z-10" />
      </div>

      {isExpanded && (
        <div id={panelId} className="flex-1 overflow-y-auto px-3 pb-3 pt-3 min-h-0 w-full">
          <XboxRecentlyPlayedExpanded game={game} />
        </div>
      )}
    </div>
  )
}
