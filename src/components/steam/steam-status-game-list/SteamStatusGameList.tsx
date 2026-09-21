'use client'

import { useMasonryLayout } from '@/hooks/useMasonryLayout'
import SteamStatusGameItem from '@/components/steam/steam-status-game-item/SteamStatusGameItem'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import type { SteamGameProgress } from '@/types/steam'

const MASONRY_GAP = 12

/**
 * Steam games in the same masonry layout as RA's StatusGameList, so an
 * expanded card pushes down only its own column instead of leaving a gap
 * beside it, and the grid control drives both lists alike.
 */
export default function SteamStatusGameList({
  games,
  gridCols = 2,
}: {
  games: SteamGameProgress[]
  gridCols?: StatusGridCols
}) {
  const { containerRef, setItemRef, positions, containerHeight } = useMasonryLayout(
    games.length,
    gridCols,
    MASONRY_GAP,
  )

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: containerHeight }}>
      {games.map((g, i) => (
        <SteamStatusGameItem
          key={g.id}
          game={g}
          itemRef={setItemRef(i)}
          style={
            positions[i]
              ? { position: 'absolute', top: positions[i].top, left: positions[i].left, width: positions[i].width }
              : { position: 'absolute', top: 0, left: 0, width: 0, visibility: 'hidden' }
          }
        />
      ))}
    </div>
  )
}
