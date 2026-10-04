import { CategoryGame } from '../../hooks/useGamesByCategory'
import { UserAward } from '@/types/types'
import StatusGameItem from './StatusGameItem'
import { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

export type GameExtraData = {
  lastPlayed?: string
  awards: UserAward[]
  possibleScore?: number
  scoreAchieved?: number
  scoreAchievedHardcore?: number
}

// Columns the grid control asks for, fewer on narrower screens.
export const STATUS_GRID_COLS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
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
    <div className={`grid gap-3 items-start w-full ${STATUS_GRID_COLS[gridCols]}`}>
      {games.map((g) => (
        <StatusGameItem key={g.ID ?? g.GameID} game={g} extra={extraData?.get(g.GameID ?? (g.ID as number))} category={category} />
      ))}
    </div>
  )
}
