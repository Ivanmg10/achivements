import { IconArrowDown, IconArrowUp } from '@tabler/icons-react'
import { TH } from '@/components/ui/dataTable'

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
  align = 'left',
  className,
}: {
  sortKey: SortKey
  sortState: SortState
  onSort: (key: SortKey) => void
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}) {
  const active = sortState.key === sortKey
  const ariaSort = active ? (sortState.dir === 'asc' ? 'ascending' : 'descending') : 'none'
  const Arrow = sortState.dir === 'asc' ? IconArrowUp : IconArrowDown
  const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

  return (
    <th scope="col" aria-sort={ariaSort} className={`${TH} ${ALIGN[align]} ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-[inherit] select-none transition-colors hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
          active ? 'text-text-main' : 'text-text-secondary'
        }`}
      >
        {children}
        {active && <Arrow className="w-3 h-3" aria-hidden="true" />}
      </button>
    </th>
  )
}
