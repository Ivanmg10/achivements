import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import type { GameGroupItem } from '@/types/types'
import { isRa, type AchStats, type PtsStats } from '@/utils/groupItems'
import SortableItem from '@/components/groups/sortable-item/SortableItem'
import SteamSortableItem from '@/components/groups/steam-sortable-item/SteamSortableItem'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

const GRID_COLS_CLASS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

/**
 * A group's games as cards, RA and Steam side by side. With no filter on they
 * can be dragged (or moved with the keyboard) into a new order; a filtered
 * view is not the whole list, so it cannot be reordered.
 */
export default function GroupGameGrid({
  items,
  draggable,
  gridCols,
  ach,
  pts,
  lastPlayed,
  onRemove,
  onReorder,
}: {
  items: GameGroupItem[]
  draggable: boolean
  gridCols: StatusGridCols
  ach: Map<number, AchStats>
  pts: Map<number, PtsStats>
  lastPlayed: Map<number, string>
  onRemove: (id: number) => void
  onReorder: (activeId: number, overId: number) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const grid = (
    <div className={`grid gap-3 ${GRID_COLS_CLASS[gridCols]}`}>
      {items.map((item) =>
        isRa(item) ? (
          <SortableItem
            key={item.id}
            item={item}
            onRemove={onRemove}
            draggable={draggable}
            achStats={ach.get(item.game_id)}
            ptsStats={pts.get(item.game_id)}
            lastPlayed={lastPlayed.get(item.game_id)}
          />
        ) : (
          <SteamSortableItem key={item.id} item={item} onRemove={onRemove} draggable={draggable} />
        ),
      )}
    </div>
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
