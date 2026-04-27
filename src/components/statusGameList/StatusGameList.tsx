import { CategoryGame } from '../../hooks/useGamesByCategory'
import StatusGameItem from './StatusGameItem'

export default function StatusGameList({ games }: { games: CategoryGame[] }) {
  return (
    <>
      {games.map((g) => (
        <StatusGameItem key={g.ID ?? g.GameID} game={g} />
      ))}
    </>
  )
}
