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
import SteamPinnedGameRow from './steam-pinned-game-row/SteamPinnedGameRow'
import { gameKey, GameRef } from '@/utils/gameRef'

export default function MainPagePinnedGames() {
  const { T } = useLanguage()
  const { pins, isLoading, reorder } = usePinnedGames()
  const [localPins, setLocalPins] = useState<GameRef[] | null>(null)
  // Keys, not ids: an RA game and a Steam app can share an id.
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const displayPins = localPins ?? pins
  const keys = displayPins.map((p) => gameKey(p.source, p.id))

  function toggleExpand(key: string) {
    setExpandedKey((current) => (current === key ? null : key))
  }

  function renderRow(pin: GameRef, isOpen: boolean) {
    const key = gameKey(pin.source, pin.id)
    const onToggle = () => toggleExpand(key)
    return pin.source === 'steam' ? (
      <SteamPinnedGameRow key={key} appId={pin.id} isOpen={isOpen} onToggle={onToggle} />
    ) : (
      <PinnedGameRow key={key} gameId={pin.id} isOpen={isOpen} onToggle={onToggle} />
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = keys.indexOf(String(active.id))
    const newIndex = keys.indexOf(String(over.id))
    const next = arrayMove(displayPins, oldIndex, newIndex)
    setLocalPins(next)
    try {
      await reorder(next)
    } finally {
      setLocalPins(null)
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
        ) : expandedKey !== null && displayPins.some((p) => gameKey(p.source, p.id) === expandedKey) ? (
          renderRow(displayPins.find((p) => gameKey(p.source, p.id) === expandedKey)!, true)
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={keys} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayPins.map((pin) => renderRow(pin, false))}
                <PinGameCard />
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  )
}
