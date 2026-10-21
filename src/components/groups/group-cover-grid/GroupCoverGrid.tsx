import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import type { GameGroupItem } from '@/types/types'
import type { ItemProgress } from '@/utils/groupItems'
import GroupCoverTile from '@/components/groups/group-cover-tile/GroupCoverTile'

/**
 * A group's games as a grid of covers, every platform alike. Like the list,
 * they can be dragged (or moved with the keyboard) only while no filter hides any.
 */
export default function GroupCoverGrid({
  items,
  progress,
  draggable,
  onRemove,
  onReorder,
}: {
  items: GameGroupItem[]
  progress: (item: GameGroupItem) => ItemProgress
  draggable: boolean
  onRemove: (id: number) => void
  onReorder: (activeId: number, overId: number) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const grid = (
    <ul className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(7.5rem,9rem))]">
      {items.map((item) => (
        <GroupCoverTile key={item.id} item={item} progress={progress(item)} draggable={draggable} onRemove={onRemove} />
      ))}
    </ul>
  )

  if (!draggable) return grid

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) onReorder(Number(active.id), Number(over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        {grid}
      </SortableContext>
    </DndContext>
  )
}
