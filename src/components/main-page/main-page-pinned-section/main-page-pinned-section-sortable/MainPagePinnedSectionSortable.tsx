'use client'

import type { ReactNode } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import MainPagePinnedSectionSortableItem from '../main-page-pinned-section-sortable-item/MainPagePinnedSectionSortableItem'

/**
 * A grid of tiles the user can put in their own order by dragging each one's
 * grip, for the pinned achievements and the pinned games alike. It only
 * reports the new order; saving it is the caller's.
 */
export default function MainPagePinnedSectionSortable<T>({
  items,
  idOf,
  labelOf,
  onReorder,
  className,
  renderItem,
}: {
  items: T[]
  idOf: (item: T) => string
  labelOf: (item: T) => string
  onReorder: (next: T[]) => void
  className: string
  renderItem: (item: T, handle: ReactNode) => ReactNode
}) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const ids = items.map(idOf)

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(items, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={className}>
          {items.map((item) => (
            <MainPagePinnedSectionSortableItem key={idOf(item)} id={idOf(item)} label={labelOf(item)}>
              {(handle) => renderItem(item, handle)}
            </MainPagePinnedSectionSortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
