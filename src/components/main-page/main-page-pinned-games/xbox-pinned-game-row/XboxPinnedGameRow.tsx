'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconChevronDown, IconGripVertical } from '@tabler/icons-react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useSpotlight } from '@/hooks/useSpotlight'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import GameIcon from '@/components/game-icon/GameIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import XboxRecentlyPlayedExpanded from '@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import { gameHref, gameKey } from '@/utils/gameRef'
import { xboxBackdrop } from '@/utils/xboxTitles'

/**
 * A pinned Xbox game on the main page — PsnPinnedGameRow's counterpart: drag
 * handle, icon, title, platform, progress bar, unpin, and the same expanded
 * dashboard as the recent feed. Game data comes from the shared library, so a
 * pin costs no request of its own.
 */
export default function XboxPinnedGameRow({ gameId, isOpen, onToggle }: { gameId: number; isOpen: boolean; onToggle: () => void }) {
  const { T } = useLanguage()
  const onPointerMove = useSpotlight()
  const { fullLibrary, libraryLoading } = useXboxGamesData()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: gameKey('xbox', gameId) })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const game = fullLibrary.find((g) => g.id === gameId)

  if (!game) {
    // Loading, or a pin for a game no longer in the library (Xbox unlinked): a placeholder that can still be unpinned.
    return libraryLoading ? (
      <div ref={setNodeRef} style={style} className="bg-bg-main rounded-xl h-24 animate-pulse" />
    ) : (
      <div ref={setNodeRef} style={style} className="bg-bg-main rounded-2xl flex items-center gap-3 px-3 py-3">
        <XboxLogo size={20} className="text-text-secondary shrink-0" aria-hidden="true" />
        <span className="text-sm text-text-secondary flex-1">Xbox</span>
        <PinToggleButton gameId={gameId} source="xbox" />
      </div>
    )
  }

  const href = gameHref('xbox', gameId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-main rounded-2xl overflow-hidden flex flex-col ring-1 ring-ink/[0.04] ${isDragging ? 'opacity-50 shadow-2xl z-10' : ''}`}
    >
      <GameCardBackdrop src={xboxBackdrop(game)} />
      <div className="flex items-center gap-3 px-3 py-3 w-full">
        <button
          {...attributes}
          {...listeners}
          aria-label={T.cards.dragToReorder}
          className="text-text-secondary/30 hover:text-text-secondary cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
        >
          <IconGripVertical className="w-4 h-4" aria-hidden />
        </button>

        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
          <GameIcon source="xbox" id={gameId} imageUrl={game.imageIcon} size={56} className="rounded-xl w-14 h-14" />
        </Link>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Link
            href={href}
            className="w-fit max-w-full hover:underline underline-offset-2 decoration-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
          >
            <span className="text-base font-bold block truncate leading-tight">{game.title}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 shrink-0 text-xs text-text-secondary">
              <XboxLogo size={12} className="opacity-60" aria-hidden="true" />
              {game.consoleName}
            </span>
            <ProgressBar pct={game.pctWon} label={game.title} className="flex-1" />
            <PinToggleButton gameId={gameId} source="xbox" className="ml-auto" />
            <button
              onClick={onToggle}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? T.xbox.hideAchievements : T.xbox.showAchievements}: ${game.title}`}
              className="p-1 rounded text-text-secondary/40 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 shrink-0"
            >
              <IconChevronDown size={14} aria-hidden="true" className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{game.totalKnown ? `${game.numAwarded}/${game.maxPossible} ${T.xbox.achievements.toLowerCase()}` : `${game.numAwarded} ${T.xbox.achievements.toLowerCase()}`}</span>
            <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-3 pb-3 pt-1">
          <XboxRecentlyPlayedExpanded game={game} />
        </div>
      )}
    </div>
  )
}
