'use client'

import { useState } from 'react'
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
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useLanguage } from '@/context/LanguageContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { MainViewToggle } from '@/components/main-view-toggle/MainViewToggle'
import PinnedGameRow from './pinned-game-row/PinnedGameRow'
import PinGameCard from './pin-game-card/PinGameCard'

export default function MainPagePinnedGames() {
  const { T } = useLanguage()
  const { pinnedIds, isLoading, reorder } = usePinnedGames()
  const [localIds, setLocalIds] = useState<number[] | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const displayIds = localIds ?? pinnedIds

  function toggleExpand(gameId: number) {
    setExpandedId((current) => (current === gameId ? null : gameId))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = displayIds.findIndex((id) => id === active.id)
    const newIndex = displayIds.findIndex((id) => id === over.id)
    const next = arrayMove(displayIds, oldIndex, newIndex)
    setLocalIds(next)
    try {
      await reorder(next)
    } finally {
      setLocalIds(null)
    }
  }

  return (
    <section className="main-content bg-bg-card text-text-main m-3 rounded-xl p-4 flex flex-col flex-1 min-h-0 gap-2 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        <p className="text-2xl font-bold flex-1">{T.pinnedGames.title}</p>
        <MainViewToggle />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-24 bg-bg-main rounded-xl animate-pulse" />
            <div className="h-24 bg-bg-main rounded-xl animate-pulse" />
          </div>
        ) : expandedId !== null ? (
          <PinnedGameRow
            gameId={expandedId}
            isOpen
            onToggle={() => toggleExpand(expandedId)}
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayIds.map((id) => (
                  <PinnedGameRow
                    key={id}
                    gameId={id}
                    isOpen={false}
                    onToggle={() => toggleExpand(id)}
                  />
                ))}
                <PinGameCard />
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  )
}
