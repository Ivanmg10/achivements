'use client'

import { useId, useState } from 'react'
import { IconChevronDown, IconClock } from '@tabler/icons-react'
import type { PsnCollection, PsnGameProgress } from '@/types/psn'
import { useLanguage } from '@/context/LanguageContext'
import { useSpotlight } from '@/hooks/useSpotlight'
import { formatDate } from '@/utils/utils'
import { psnBackdrop } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameIcon from '@/components/game-icon/GameIcon'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import PsnCollectionExpanded from '@/components/psn/psn-collection-expanded/PsnCollectionExpanded'

/**
 * A collection (The Ezio Collection) in the recent feed: one card with the
 * collection's session, hours and icon, since Sony does not say which of its
 * games was played. Opened, it is laid out like an opened game, with each of
 * its games as a fold of trophies (as a game's DLC). It has no page or pin of
 * its own: those stay per game.
 */
export default function PsnCollectionItem({
  collection,
  games,
  expanded,
  onToggle,
  className = '',
}: {
  collection: PsnCollection
  games: PsnGameProgress[]
  expanded?: boolean
  onToggle?: () => void
  className?: string
}) {
  const { T, lang } = useLanguage()
  const [localExpanded, setLocalExpanded] = useState(false)
  const onPointerMove = useSpotlight()
  const panelId = useId()

  const isExpanded = expanded ?? localExpanded
  const toggle = onToggle ?? (() => setLocalExpanded((v) => !v))
  const awarded = games.reduce((sum, g) => sum + g.numAwarded, 0)
  const total = games.reduce((sum, g) => sum + g.maxPossible, 0)
  const pct = total > 0 ? Math.round((awarded / total) * 100) : 0
  const consoles = [...new Set(games.map((g) => g.consoleName))].join(' · ')
  const lastPlayed = [collection.lastPlayed, ...games.map((g) => g.lastPlayed)].filter((d): d is string => !!d).sort().at(-1)

  return (
    <div
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-main rounded-2xl overflow-hidden flex flex-col min-h-0 ring-1 ring-ink/[0.04] ${className}`}
    >
      <GameCardBackdrop src={collection.heroUrl ?? psnBackdrop(games[0])} />

      <button
        onClick={toggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={`${isExpanded ? T.psn.hideGames : T.psn.showGames}: ${collection.title}`}
        className="relative flex items-center gap-3 px-3 py-3 shrink-0 w-full text-left cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1] group"
      >
        <GameIcon
          source="psn"
          id={games[0].id}
          imageUrl={collection.iconUrl ?? games[0].imageIcon}
          size={64}
          className="rounded-xl w-14 h-14 sm:w-16 sm:h-16 shrink-0 shadow-md shadow-black/30 ring-1 ring-ink/10"
        />

        <span className="flex flex-col min-w-0 flex-1 gap-1">
          <span className="text-base font-bold block truncate leading-tight">{collection.title}</span>

          <span className="flex items-center gap-2 w-full">
            <span className="flex items-center gap-1 shrink-0 text-xs text-text-secondary">
              <PlaystationLogo size={12} className="opacity-60" aria-hidden="true" />
              {consoles}
            </span>
            <ProgressBar pct={pct} label={collection.title} className="flex-1" />
            <span className={`text-xs font-semibold tabular-nums shrink-0 ${pct >= 100 ? 'text-success' : 'text-text-main'}`}>{pct}%</span>
            <IconChevronDown
              size={14}
              aria-hidden="true"
              className={`ml-auto shrink-0 text-text-secondary/40 group-hover:text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </span>

          <span className="flex flex-wrap items-center gap-x-2 text-xs text-text-secondary">
            <span className="whitespace-nowrap">
              {games.length} {T.psn.collectionGames}
            </span>
            <span className="opacity-40" aria-hidden="true">·</span>
            <span className="whitespace-nowrap">
              {awarded}/{total} {T.psn.trophies.toLowerCase()}
            </span>
            {collection.playtimeMinutes !== null && (
              <>
                <span className="opacity-40" aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <IconClock size={12} aria-hidden="true" />
                  <span className="sr-only">{T.steam.playtime}: </span>
                  {formatPlaytime(collection.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
                </span>
              </>
            )}
            {lastPlayed && (
              <>
                <span className="opacity-40" aria-hidden="true">·</span>
                <span>{formatDate(lastPlayed)}</span>
              </>
            )}
          </span>
        </span>
      </button>

      {isExpanded && (
        <div id={panelId} className="relative flex-1 overflow-y-auto px-3 pb-3 pt-3 min-h-0 w-full">
          <PsnCollectionExpanded games={games} />
        </div>
      )}
    </div>
  )
}
