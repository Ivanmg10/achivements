import { GameGroup } from '@/types/types'
import type { GroupView } from '@/components/groups/group-view-toggle/GroupViewToggle'
import GroupAlbumCard from '@/components/groups/group-album-card/GroupAlbumCard'
import GroupShelfRow from '@/components/groups/group-shelf-row/GroupShelfRow'
import GroupNewTile from '@/components/groups/group-new-tile/GroupNewTile'

/**
 * The user's groups, in their order: cover cards, as many to a row as fit, or
 * one shelf per row. With `onCreate`, a last tile makes a new one while any fit.
 */
export default function GroupList({
  groups,
  view = 'covers',
  remaining = 0,
  onCreate,
}: {
  groups: GameGroup[]
  view?: GroupView
  remaining?: number
  onCreate?: () => void
}) {
  const shelves = view === 'shelves'
  return (
    <ul className={shelves ? 'flex flex-col gap-4' : 'grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))]'}>
      {groups.map((group) => (
        <li key={group.id} className="min-w-0">
          {shelves ? <GroupShelfRow group={group} /> : <GroupAlbumCard group={group} />}
        </li>
      ))}
      {onCreate && remaining > 0 && (
        <li className="min-w-0">
          <GroupNewTile view={view} remaining={remaining} onClick={onCreate} />
        </li>
      )}
    </ul>
  )
}
