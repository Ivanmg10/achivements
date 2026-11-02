import { SortableHeader } from '@/components/game-info-table/SortableHeader'

export type SteamSortKey = 'default' | 'rarity' | 'earned'
export type SteamSortDir = 'asc' | 'desc'
export type SteamSortState = { key: SteamSortKey; dir: SteamSortDir }

/** First click direction per column: rarest first, newest unlock first. */
export const STEAM_DEFAULT_DIRS: Record<SteamSortKey, SteamSortDir> = {
  default: 'asc',
  rarity: 'asc',
  earned: 'desc',
}

/** RA's sortable header with Steam's keys (PlayStation and Xbox use it too). */
export function SteamSortableHeader(props: {
  sortKey: SteamSortKey
  sortState: SteamSortState
  onSort: (key: SteamSortKey) => void
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}) {
  return <SortableHeader<SteamSortKey> {...props} />
}
