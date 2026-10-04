'use client'

import { useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSpotlight } from '@/hooks/useSpotlight'
import { RecentlyPlayedGame } from '@/types/types'
import { CONSOLES } from '@/constants'
import { formatDate } from '@/utils/utils'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'

const CONSOLE_BY_NAME = new Map(CONSOLES.map((c) => [c.name, c.icon]))

function pct(achieved: number, total: number) {
  return total ? (achieved / total) * 100 : 0
}

/**
 * One RA game as a row card, the counterpart of SteamGameItem: the game's
 * blurred art behind it, cover and title opening the game page, and the rest
 * of the card a button that expands its achievements (`children`).
 *
 * A mastered game (every achievement in hardcore) gets a gold ring on the
 * cover, alongside the 100% — not by colour alone.
 */
export default function RaGameItem({
  game,
  expanded,
  onToggle,
  children,
  className = '',
}: {
  game: RecentlyPlayedGame
  expanded: boolean
  onToggle: () => void
  /** The expanded panel, rendered only while expanded. */
  children?: React.ReactNode
  className?: string
}) {
  const { T } = useLanguage()
  const onPointerMove = useSpotlight()
  const panelId = useId()

  const href = `/gameInfo/${game.GameID}`
  const art = game.ImageIcon ? `https://retroachievements.org${game.ImageIcon}` : null
  const consoleIcon = CONSOLE_BY_NAME.get(game.ConsoleName)
  const total = game.NumPossibleAchievements
  const earnedAch = game.NumAchievedHardcore || game.NumAchieved
  const earnedPts = game.ScoreAchievedHardcore || game.ScoreAchieved
  const progress = Math.round(pct(earnedAch, total))
  const mastered = total > 0 && game.NumAchievedHardcore >= total

  return (
    <div
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-main rounded-2xl overflow-hidden flex flex-col min-h-0 ring-1 ring-ink/[0.04] ${className}`}
    >
      <GameCardBackdrop src={art} />

      {/* relative: the expand button stretches over this whole row (see below). */}
      <div className="relative flex items-center gap-3 px-3 py-3 shrink-0">
        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
          {art ? (
            <Image
              src={art}
              alt=""
              width={64}
              height={64}
              className={`rounded-xl object-cover w-14 h-14 sm:w-16 sm:h-16 shadow-md shadow-black/30 transition-transform duration-300 hover:scale-105 ${
                mastered ? 'ring-2 ring-amber-400' : 'ring-1 ring-ink/10'
              }`}
            />
          ) : (
            <span className="block w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-ink/10" />
          )}
          {consoleIcon && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-bg-card ring-1 ring-ink/10 flex items-center justify-center">
              <Image src={consoleIcon} alt="" width={12} height={12} className="w-3 h-3 object-contain" />
            </span>
          )}
        </Link>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Link
            href={href}
            className="relative z-10 w-fit max-w-full hover:underline underline-offset-2 decoration-ink/40 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <span className="text-base font-bold block truncate leading-tight">{game.Title}</span>
          </Link>

          <button
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? T.steam.hideAchievements : T.steam.showAchievements}: ${game.Title}`}
            className="flex flex-col gap-1 w-full text-left rounded group cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <span className="flex items-center gap-2 w-full">
              <span className="text-xs text-text-secondary truncate max-w-[45%] shrink-0">{game.ConsoleName}</span>
              {total > 0 && (
                <>
                  <DualProgressBar
                    softcorePct={pct(game.NumAchieved, total)}
                    hardcorePct={pct(game.NumAchievedHardcore, total)}
                    className="flex-1"
                  />
                  <span className={`text-xs font-semibold tabular-nums shrink-0 ${mastered ? 'text-amber-400' : 'text-text-main'}`}>
                    {progress}%
                  </span>
                </>
              )}
              <IconChevronDown
                size={14}
                aria-hidden="true"
                className={`ml-auto shrink-0 text-text-secondary/40 group-hover:text-text-secondary transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </span>

            <span className="flex flex-wrap items-center gap-x-2 text-xs text-text-secondary">
              {total > 0 && (
                <>
                  <span className="whitespace-nowrap">
                    {earnedAch}/{total} {T.statusGameItem.achievements}
                  </span>
                  <span className="opacity-40" aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">
                    {earnedPts}/{game.PossibleScore} pts
                  </span>
                  <span className="opacity-40" aria-hidden="true">·</span>
                </>
              )}
              <span className="whitespace-nowrap">{formatDate(game.LastPlayed)}</span>
            </span>
          </button>
        </div>

        {/* Outside the expand button (a button inside a button is invalid HTML), and above its stretched hit area. */}
        <PinToggleButton gameId={game.GameID} className="self-center relative z-10" />
      </div>

      {expanded && (
        <div id={panelId} className="flex-1 overflow-y-auto px-3 pb-3 pt-3 min-h-0 w-full">
          {children}
        </div>
      )}
    </div>
  )
}
