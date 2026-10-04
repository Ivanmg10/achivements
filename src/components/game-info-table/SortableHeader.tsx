export type SortKey = 'default' | 'points' | 'rarity' | 'players' | 'hc' | 'earned'
export type SortDir = 'asc' | 'desc'
export type SortState = { key: SortKey; dir: SortDir }

export const DEFAULT_DIRS: Record<SortKey, SortDir> = {
  default: 'asc',
  points: 'desc',
  rarity: 'asc',
  players: 'desc',
  hc: 'desc',
  earned: 'desc',
}

/**
 * A sortable column header: the control is a real button, and the column
 * reports its order through aria-sort (as the Steam table's does).
 */
export function SortableHeader({
  sortKey,
  sortState,
  onSort,
  children,
  className,
}: {
  sortKey: SortKey
  sortState: SortState
  onSort: (key: SortKey) => void
  children: React.ReactNode
  className?: string
}) {
  const active = sortState.key === sortKey
  const arrow = active ? (sortState.dir === 'asc' ? ' ↑' : ' ↓') : ''
  const ariaSort = active ? (sortState.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th aria-sort={ariaSort} className={`px-3 py-2 ${className ?? ''}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`select-none transition-colors hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
          active ? 'text-text-main' : 'text-text-secondary'
        }`}
      >
        {children}
        <span aria-hidden="true">{arrow}</span>
      </button>
    </th>
  )
}
