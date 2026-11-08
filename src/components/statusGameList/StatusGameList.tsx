import { CategoryGame } from '../../hooks/useGamesByCategory'
import { UserAward } from '@/types/types'
import StatusGameItem from './StatusGameItem'
import { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { STATUS_GRID_COLS } from '@/components/status-grid-control/statusGridCols'

export type GameExtraData = {
  lastPlayed?: string
  awards: UserAward[]
  possibleScore?: number
  scoreAchieved?: number
  scoreAchievedHardcore?: number
}

/**
 * A status list as a plain grid, in reading order. Closed cards are all the
 * same height, so rows line up; an opened card grows its own row, and the
 * cards beside it stay where they are (aligned to the top) rather than being
 * moved around while it animates.
 */
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
  return (
    <div className={`grid gap-3 items-start w-full enter-cards ${STATUS_GRID_COLS[gridCols]}`}>
      {games.map((g) => (
        <StatusGameItem key={g.ID ?? g.GameID} game={g} extra={extraData?.get(g.GameID ?? (g.ID as number))} category={category} />
      ))}
    </div>
  )
}
