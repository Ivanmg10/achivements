'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useLanguage } from '@/context/LanguageContext'
import { applyPerfectOrder, type PerfectGame } from '@/utils/perfectGames'
import CommonModal from '@/components/common-modal/CommonModal'
import PerfectGameOrderRow from './perfect-game-order-row/PerfectGameOrderRow'

export default function PerfectGamesOrderModal({
  isOpen,
  onClose,
  games,
  order,
  onSaveOrder,
}: {
  isOpen: boolean
  onClose: () => void
  games: PerfectGame[]
  order: string[]
  onSaveOrder: (order: string[]) => Promise<void>
}) {
  const { T } = useLanguage()
  const [localList, setLocalList] = useState<PerfectGame[]>([])

  useEffect(() => {
    if (isOpen) setLocalList(applyPerfectOrder(games, order))
  }, [isOpen, games, order])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localList.findIndex((g) => g.key === active.id)
    const newIndex = localList.findIndex((g) => g.key === over.id)
    setLocalList(arrayMove(localList, oldIndex, newIndex))
  }

  async function handleClose() {
    try {
      await onSaveOrder(localList.map((g) => g.key))
    } catch (err) {
      console.error('Failed to save mastered games order', err)
    } finally {
      onClose()
    }
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose} className="max-w-lg max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-semibold">{T.cards.reorderMasteredTitle}</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localList.map((g) => g.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {localList.map((g) => (
              <PerfectGameOrderRow key={g.key} game={g} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={handleClose}
        className="mt-4 self-end px-4 py-2 rounded-lg bg-accent text-bg-main text-sm font-medium cursor-pointer"
      >
        {T.cards.close}
      </button>
    </CommonModal>
  )
}
