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
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-3 py-2 cursor-pointer select-none transition-colors hover:text-text-main ${
        active ? 'text-text-main' : 'text-text-secondary'
      } ${className ?? ''}`}
    >
      {children}
      {arrow}
    </th>
  )
}
