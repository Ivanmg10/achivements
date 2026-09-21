export type SteamSortKey = 'default' | 'rarity' | 'earned'
export type SteamSortDir = 'asc' | 'desc'
export type SteamSortState = { key: SteamSortKey; dir: SteamSortDir }

/** First click direction per column: rarest first, newest unlock first. */
export const STEAM_DEFAULT_DIRS: Record<SteamSortKey, SteamSortDir> = {
  default: 'asc',
  rarity: 'asc',
  earned: 'desc',
}

/**
 * A sortable column header. Same look as RA's SortableHeader, but the control
 * is a real button and the column reports its order through aria-sort.
 */
export function SteamSortableHeader({
  sortKey,
  sortState,
  onSort,
  children,
  className = '',
}: {
  sortKey: SteamSortKey
  sortState: SteamSortState
  onSort: (key: SteamSortKey) => void
  children: React.ReactNode
  className?: string
}) {
  const active = sortState.key === sortKey
  const arrow = active ? (sortState.dir === 'asc' ? ' ↑' : ' ↓') : ''
  const ariaSort = active ? (sortState.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th aria-sort={ariaSort} className={`px-3 py-2 ${className}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`select-none transition-colors hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] ${
          active ? 'text-text-main' : 'text-text-secondary'
        }`}
      >
        {children}
        <span aria-hidden="true">{arrow}</span>
      </button>
    </th>
  )
}
