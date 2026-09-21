'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { IconBrandSteam, IconChevronDown, IconClock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import SteamGameItemAchievements from './steam-game-item-achievements/SteamGameItemAchievements'
import { formatPlaytime } from '@/utils/steamFeed'
import { formatDate } from '@/utils/utils'
import type { SteamGameProgress } from '@/types/steam'

/**
 * One Steam game as a row card: icon, title, progress and playtime, expanding
 * to its achievements. The Steam counterpart of an RA card in the same lists.
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
      <button
        onClick={toggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex items-center gap-3 px-3 py-3 w-full text-left hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] shrink-0"
      >
        {game.imageIcon ? (
          <Image
            src={game.imageIcon}
            alt=""
            width={56}
            height={56}
            className="rounded-xl object-cover w-14 h-14 shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-[#1b2838] shrink-0 flex items-center justify-center" aria-hidden="true">
            <IconBrandSteam size={28} className="text-[#66c0f4]" />
          </div>
        )}

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <span className="text-base font-bold block truncate leading-tight">{game.title}</span>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 shrink-0 text-xs text-text-secondary">
              <IconBrandSteam size={12} className="opacity-60" aria-hidden="true" />
              Steam
            </span>
            {hasCounts && <SteamProgressBar pct={game.pctWon} label={game.title} className="flex-1" />}
            <IconChevronDown
              size={14}
              aria-hidden="true"
              className={`ml-auto shrink-0 text-text-secondary/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 text-xs text-text-secondary/60">
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
          </div>
        </div>
      </button>

      {isExpanded && (
        <div id={panelId} className="flex-1 px-3 pb-3 pt-1 overflow-y-auto min-h-0">
          {game.hasStats ? (
            <SteamGameItemAchievements appId={game.id} />
          ) : (
            <p className="text-sm text-text-secondary">{T.steam.noAchievements}</p>
          )}
        </div>
      )}
    </div>
  )
}
