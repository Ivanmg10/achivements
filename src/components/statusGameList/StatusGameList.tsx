import { CategoryGame } from '../../hooks/useGamesByCategory'
import { UserAward } from '@/types/types'
import StatusGameItem from './StatusGameItem'

export type GameExtraData = {
  lastPlayed?: string
  awards: UserAward[]
  possibleScore?: number
  scoreAchieved?: number
  scoreAchievedHardcore?: number
}

export default function StatusGameList({
  games,
  extraData,
  category,
}: {
  games: CategoryGame[]
  extraData?: Map<number, GameExtraData>
  category?: string
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {games.map((g) => (
        <StatusGameItem
          key={g.ID ?? g.GameID}
          game={g}
          extra={extraData?.get(g.GameID ?? (g.ID as number))}
          category={category}
        />
      ))}
    </div>
  )
}
