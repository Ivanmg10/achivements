import { IconArrowDown, IconArrowUp } from '@tabler/icons-react'
import { TH } from '@/components/ui/dataTable'
import type { SortDir } from '@/utils/achievementTable'

/**
 * A sortable column header: the control is a real button, and the column
 * reports its order through aria-sort.
 */
export function SortableHeader<K extends string>({
  sortKey,
  sortState,
  onSort,
  children,
  align = 'left',
  className,
}: {
  sortKey: K
  sortState: { key: K; dir: SortDir }
  onSort: (key: K) => void
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
        className={`inline-flex items-center gap-1 select-none transition-colors hover:text-text-main rounded focus-ring ${
          active ? 'text-text-main' : 'text-text-secondary'
        }`}
      >
        {children}
        {active && <Arrow className="w-3 h-3" aria-hidden="true" />}
      </button>
    </th>
  )
}
