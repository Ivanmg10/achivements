'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconChevronDown, IconGripVertical } from '@tabler/icons-react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamRecentlyPlayedExpanded from '@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded'
import { gameKey } from '@/utils/gameRef'
import { toSteamGameProgress } from '@/utils/steamMappers'

/**
 * A pinned Steam game on the main page — PinnedGameRow's counterpart: drag
 * handle, cover, title, Steam label, progress bar, unpin, and the same
 * expanded dashboard as the recent feed. Game data comes from the shared
 * library, so a pin costs no request of its own.
 */
export default function SteamPinnedGameRow({
  appId,
  isOpen,
  onToggle,
}: {
  appId: number
  isOpen: boolean
  onToggle: () => void
}) {
  const { T } = useLanguage()
  const { library, recent, libraryLoading } = useSteamGamesData()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: gameKey('steam', appId),
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const found = library.find((g) => g.id === appId) ?? recent.find((g) => g.id === appId)

  if (!found && libraryLoading) {
    return <div ref={setNodeRef} style={style} className="bg-bg-main rounded-xl h-24 animate-pulse" />
  }

  // A pin for a game no longer in the library (refunded, family share ended)
  // still renders, with what can be known without it.
  const game =
    found ??
    toSteamGameProgress({ appid: appId, name: `App ${appId}`, playtime_forever: 0, has_community_visible_stats: true })
  const href = `/steamGame/${appId}`
  const hasCounts = game.achievementsLoaded && game.maxPossible > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-bg-main rounded-xl overflow-hidden flex flex-col ${isDragging ? 'opacity-50 shadow-2xl relative z-10' : ''}`}
    >
      <div className="flex items-center gap-3 px-3 py-3 w-full">
        <button
          {...attributes}
          {...listeners}
          aria-label={T.cards.dragToReorder}
          className="text-text-secondary/30 hover:text-text-secondary/70 cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] rounded"
        >
          <IconGripVertical className="w-4 h-4" aria-hidden />
        </button>

        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
          <SteamGameImage appId={appId} iconUrl={game.imageIcon} size={56} className="rounded-xl w-14 h-14" />
        </Link>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Link
            href={href}
            className="w-fit max-w-full hover:underline underline-offset-2 decoration-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] rounded"
          >
            <span className="text-base font-bold block truncate leading-tight">{game.title}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 shrink-0 text-xs text-text-secondary">
              <SteamLogo size={12} className="opacity-60" aria-hidden="true" />
              Steam
            </span>
            {hasCounts && <SteamProgressBar pct={game.pctWon} label={game.title} className="flex-1" />}
            <PinToggleButton gameId={appId} source="steam" className="ml-auto" />
            <button
              onClick={onToggle}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? T.steam.hideAchievements : T.steam.showAchievements}: ${game.title}`}
              className="p-1 rounded text-text-secondary/40 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] shrink-0"
            >
              <IconChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {hasCounts && (
            <div className="flex items-center gap-2 text-xs text-text-secondary/50">
              <span>
                {game.numAwarded}/{game.maxPossible} {T.statusGameItem.achievements}
              </span>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-3 pb-3 pt-1">
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
