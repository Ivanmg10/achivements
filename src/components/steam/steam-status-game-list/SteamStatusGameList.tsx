import SteamStatusGameItem from '@/components/steam/steam-status-game-item/SteamStatusGameItem'
import { STATUS_GRID_COLS } from '@/components/statusGameList/StatusGameList'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import type { SteamGameProgress } from '@/types/steam'

/** Steam games in the same grid as RA's StatusGameList, driven by the same grid control. */
export default function SteamStatusGameList({ games, gridCols = 2, category }: { games: SteamGameProgress[]; gridCols?: StatusGridCols; category?: string }) {
  return (
    <div className={`grid gap-3 items-start w-full enter-cards ${STATUS_GRID_COLS[gridCols]}`}>
      {games.map((g) => (
        <SteamStatusGameItem key={g.id} game={g} category={category} />
      ))}
    </div>
  )
}
