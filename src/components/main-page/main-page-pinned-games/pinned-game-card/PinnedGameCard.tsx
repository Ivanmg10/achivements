'use client'

import { useId, type ReactNode } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameSource } from '@/types/game'
import type { PinnedGameCardView } from '@/types/gameCard'
import { gameKey } from '@/utils/gameRef'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import GameCardCover from '@/components/game-card-cover/GameCardCover'
import GameCardExpandButton from '@/components/game-card-expand-button/GameCardExpandButton'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * A pinned game on the home, for every platform: drag handle, cover, title, platform, progress, unpin
 * and the achievements that open under it. What a platform tells (`view`) is its adapter's: PinnedGameRow
 * (RA), SteamPinnedGameRow, PsnPinnedGameRow, XboxPinnedGameRow. While there is no `view` (loading, a
 * failed read, a pin whose game is gone) the row keeps its place in the sortable list and shows
 * `placeholder`. The whole header opens the panel (a real button, stretched over it); the title, the
 * cover, the handle and the pin sit above it.
 */
export default function PinnedGameCard({
  source,
  gameId,
  isOpen,
  onToggle,
  view,
  placeholder,
}: {
  source: GameSource
  gameId: number
  isOpen: boolean
  onToggle: () => void
  view?: PinnedGameCardView
  placeholder?: ReactNode
}) {
  const { T } = useLanguage()
  const panelId = useId()
  // Keyed by platform too: pinned games of every platform share one sortable list.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: gameKey(source, gameId) })
  const style = { transform: CSS.Transform.toString(transform), transition }

  if (!view) return <div ref={setNodeRef} style={style}>{placeholder}</div>

  const { href, title, backdrop, cover, platform, progress, counts, expand, panel } = view
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative isolate bg-bg-main rounded-card overflow-hidden flex flex-col ring-1 ring-ink/[0.04] ${isDragging ? 'opacity-50 shadow-2xl z-10' : ''}`}
    >
      <GameCardBackdrop src={backdrop} />
      <div className="relative flex items-center gap-3 px-3 py-3 w-full hover:bg-ink/5 transition-colors">
        <button
          {...attributes}
          {...listeners}
          aria-label={T.cards.dragToReorder}
          className="relative z-10 text-text-secondary/30 hover:text-text-secondary cursor-grab active:cursor-grabbing touch-none shrink-0 rounded focus-ring"
        >
          <IconGripVertical className="w-4 h-4" aria-hidden />
        </button>

        <GameCardCover href={href} compact>{cover}</GameCardCover>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Link
            href={href}
            className="relative z-10 w-fit max-w-full hover:underline underline-offset-2 decoration-ink/40 rounded focus-ring"
          >
            <span className="text-base font-bold block truncate leading-tight">{title}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 shrink-0 text-xs text-text-secondary">{platform}</span>
            {progress && <ProgressBar pct={progress.pct} softPct={progress.softPct} label={title} className="flex-1" />}
            <PinToggleButton gameId={gameId} source={source} className="ml-auto relative z-10" />
            <GameCardExpandButton open={isOpen} panelId={panelId} label={`${isOpen ? expand.hide : expand.show}: ${title}`} onToggle={onToggle} />
          </div>

          {counts && <div className="flex items-center gap-2 text-xs text-text-secondary">{counts}</div>}
        </div>
      </div>

      <div id={panelId}>{isOpen && <div className="px-3 pb-3 pt-1">{panel}</div>}</div>
    </div>
  )
}
