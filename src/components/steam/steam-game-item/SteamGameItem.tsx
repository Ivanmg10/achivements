'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { IconBrandSteam, IconChevronDown, IconClock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamRecentlyPlayedExpanded from '@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import { formatPlaytime } from '@/utils/steamFeed'
import { formatDate } from '@/utils/utils'
import type { SteamGameProgress } from '@/types/steam'

/**
 * One Steam game as a compact row card — the Steam counterpart of an RA card
 * in the recent feed. Cover and title open the game page; the rest of the
 * card is the button that expands its achievements.
 *
 * Deliberately absent, because Steam has no equivalent: hardcore/softcore
 * split, points, console. Playtime appears instead — RA has none.
 *
 * Expansion is controlled when `expanded`/`onToggle` are passed (the recent
 * feed shows one expanded game at a time), otherwise it is local.
 */
export default function SteamGameItem({
  game,
  expanded,
  onToggle,
  className = '',
}: {
  game: SteamGameProgress
  expanded?: boolean
  onToggle?: () => void
  /** Extra classes for the root, e.g. to fill a flex slot in the recent feed. */
  className?: string
}) {
  const { T, lang } = useLanguage()
  const [localExpanded, setLocalExpanded] = useState(false)
  const panelId = useId()

  const isExpanded = expanded ?? localExpanded
  const toggle = onToggle ?? (() => setLocalExpanded((v) => !v))
  const href = `/steamGame/${game.id}`

  const hasCounts = game.achievementsLoaded && game.maxPossible > 0
  const playtime = formatPlaytime(
    game.playtimeForever,
    { minutes: T.steam.minutesShort, hours: T.steam.hoursShort },
    lang,
  )

  let progressText: string
  if (hasCounts) progressText = `${game.numAwarded}/${game.maxPossible} ${T.steam.achievements}`
  else if (!game.hasStats) progressText = T.steam.noAchievements
  else progressText = T.steam.progressUnknown

  return (
    <div className={`bg-bg-main rounded-xl overflow-hidden flex flex-col min-h-0 ${className}`}>
      <div className="flex items-center gap-3 px-3 py-3 shrink-0">
        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
          <SteamGameImage
            appId={game.id}
            iconUrl={game.imageIcon}
            size={56}
            className="rounded-xl w-14 h-14 hover:ring-2 hover:ring-white/40 transition-shadow"
          />
        </Link>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Link
            href={href}
            className="w-fit max-w-full hover:underline underline-offset-2 decoration-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] rounded"
          >
            <span className="text-base font-bold block truncate leading-tight">{game.title}</span>
          </Link>

          <button
            onClick={toggle}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={`${isExpanded ? T.steam.hideAchievements : T.steam.showAchievements}: ${game.title}`}
            className="flex flex-col gap-1 w-full text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] group"
          >
            <span className="flex items-center gap-2 w-full">
              <span className="flex items-center gap-1 shrink-0 text-xs text-text-secondary">
                <IconBrandSteam size={12} className="opacity-60" aria-hidden="true" />
                Steam
              </span>
              {hasCounts && <SteamProgressBar pct={game.pctWon} label={game.title} className="flex-1" />}
              <IconChevronDown
                size={14}
                aria-hidden="true"
                className={`ml-auto shrink-0 text-text-secondary/40 group-hover:text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </span>

            <span className="flex flex-wrap items-center gap-x-2 text-xs text-text-secondary/60">
              <span>{progressText}</span>
              <span className="opacity-40" aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <IconClock size={12} aria-hidden="true" />
                <span className="sr-only">{T.steam.playtime}: </span>
                {playtime}
              </span>
              {game.lastPlayed && (
                <>
                  <span className="opacity-40" aria-hidden="true">·</span>
                  <span>{formatDate(game.lastPlayed)}</span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Outside the expand button: a button inside a button is invalid HTML. */}
        <PinToggleButton gameId={game.id} source="steam" className="self-center" />
      </div>

      {isExpanded && (
        <div id={panelId} className="flex-1 overflow-y-auto px-3 pb-3 pt-3 min-h-0 w-full">
          {/* The same dashboard RA games open into: ring, chart, badge grid, side panel. */}
          {game.hasStats ? (
            <SteamRecentlyPlayedExpanded game={game} />
          ) : (
            <p className="text-sm text-text-secondary">{T.steam.noAchievements}</p>
          )}
        </div>
      )}
    </div>
  )
}
