import { CategoryGame } from '../../hooks/useGamesByCategory'
import { UserAward } from '@/types/types'
import { useMasonryLayout } from '@/hooks/useMasonryLayout'
import StatusGameItem from './StatusGameItem'
import { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

export type GameExtraData = {
  lastPlayed?: string
  awards: UserAward[]
  possibleScore?: number
  scoreAchieved?: number
  scoreAchievedHardcore?: number
}

const MASONRY_GAP = 12

export default function StatusGameList({
  games,
  extraData,
  category,
  gridCols = 2,
}: {
  games: CategoryGame[]
  extraData?: Map<number, GameExtraData>
  category?: string
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
        <StatusGameItem
          key={g.ID ?? g.GameID}
          game={g}
          extra={extraData?.get(g.GameID ?? (g.ID as number))}
          category={category}
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
