import { GameGroup } from '@/types/types'
import { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import GroupCard from '@/components/groups/group-card/GroupCard'

// The layout control as density: one per row, or as many as fit at a size.
const COLUMNS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))]',
  3: 'grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]',
}

/** The user's groups, in their order, as many to a row as the screen fits. */
export default function GroupList({ groups, gridCols = 2 }: { groups: GameGroup[]; gridCols?: StatusGridCols }) {
  return (
    <ul className={`grid gap-3 ${COLUMNS[gridCols]}`}>
      {groups.map((group) => (
        <li key={group.id} className="min-w-0">
          <GroupCard group={group} />
        </li>
      ))}
    </ul>
  )
}
