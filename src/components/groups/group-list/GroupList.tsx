import { GameGroup } from '@/types/types'
import GroupAlbumCard from '@/components/groups/group-album-card/GroupAlbumCard'
import GroupNewTile from '@/components/groups/group-new-tile/GroupNewTile'

/**
 * The user's groups, in their order: cover cards, as many to a row as fit.
 * With `onCreate`, a last tile makes a new one while any fit.
 */
export default function GroupList({
  groups,
  remaining = 0,
  onCreate,
}: {
  groups: GameGroup[]
  remaining?: number
  onCreate?: () => void
}) {
  return (
    <ul className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] enter-cards">
      {groups.map((group) => (
        <li key={group.id} className="min-w-0">
          <GroupAlbumCard group={group} />
        </li>
      ))}
      {onCreate && remaining > 0 && (
        <li className="min-w-0">
          <GroupNewTile remaining={remaining} onClick={onCreate} />
        </li>
      )}
    </ul>
  )
}
