import { GameGroup } from '@/types/types'
import { useMasonryLayout } from '@/hooks/useMasonryLayout'
import { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import GroupCard from '@/components/groups/group-card/GroupCard'

const MASONRY_GAP = 12

export default function GroupList({
  groups,
  gridCols = 2,
}: {
  groups: GameGroup[]
  gridCols?: StatusGridCols
}) {
  const { containerRef, setItemRef, positions, containerHeight } = useMasonryLayout(
    groups.length,
    gridCols,
    MASONRY_GAP,
  )

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: containerHeight }}>
      {groups.map((group, i) => (
        <GroupCard
          key={group.id}
          group={group}
          itemRef={setItemRef(i)}
          style={
            positions[i]
              ? { position: 'absolute', top: positions[i].top, left: positions[i].left, width: positions[i].width }
              : { position: 'absolute', top: 0, left: 0, width: 0, visibility: 'hidden' }
          }
        />
      ))}
    </div>
  )
}
