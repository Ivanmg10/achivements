'use client'

import { useId } from 'react'
import { useExclusiveOpen } from '@/hooks/useExclusiveOpen'
import type { StatusGameCardView } from '@/types/gameCard'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import GameCardCover from '@/components/game-card-cover/GameCardCover'
import GameCardTitle from '@/components/game-card-title/GameCardTitle'
import GameCardProgress from '@/components/game-card-progress/GameCardProgress'
import GameCardExpandButton from '@/components/game-card-expand-button/GameCardExpandButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import LibraryDetailRow from '@/components/library-detail-row/LibraryDetailRow'

/**
 * A game on a category page, for every platform: cover, title, chips, "x / y", its bar and the lines
 * under it, hide, pin and the expand button; opened, its detail takes the row below as `LibraryDetailRow`.
 * What a platform tells is its adapter's (StatusGameItem for RA, SteamStatusGameItem, PsnStatusGameItem,
 * XboxStatusGameItem). Cover and title open the game; everything else in the card is the expand button
 * (a real one, stretched over the header). One card open at a time inside an `OpenCardProvider`.
 */
export default function StatusGameCard({
  source,
  gameId,
  href,
  title,
  backdrop,
  hideImage,
  cover,
  ring,
  chips,
  progress,
  expand,
  detail,
  children,
}: StatusGameCardView) {
  const panelId = useId()
  const [open, toggle] = useExclusiveOpen(`${source}:${gameId}`)

  return (
    <>
      <div
        className={`relative isolate bg-bg-card rounded-card overflow-hidden transition-shadow duration-150 ${open ? 'ring-2 ring-accent/60' : 'ring-1 ring-ink/5 hover:ring-ink/15'}`}
      >
        <GameCardBackdrop src={backdrop} surface="card" />
        {/* relative: the expand button stretches over this whole header. */}
        <div className="relative flex flex-row items-start gap-3 sm:gap-5 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
          <GameCardCover href={href} ring={ring}>{cover}</GameCardCover>

          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <GameCardTitle href={href} title={title} />
            <div className="flex items-center gap-1.5 flex-wrap">{chips}</div>
            <GameCardProgress progress={progress} label={title} />
            {children}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0 self-start sm:self-center -mr-2 sm:mr-0">
            <HideGameButton source={source} gameId={gameId} title={title} image={hideImage} className="relative z-10" />
            <PinToggleButton gameId={gameId} source={source} className="relative z-10" />
            <GameCardExpandButton open={open} panelId={panelId} label={`${open ? expand.hide : expand.show}: ${title}`} onToggle={toggle} />
          </div>
        </div>
      </div>
      <LibraryDetailRow open={open} id={panelId} title={title}>
        {detail}
      </LibraryDetailRow>
    </>
  )
}
