'use client'

import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

export default function PerfectGameOrderRow({ game }: { game: RetroAchievementsGameCompleted }) {
  const { T } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.GameID,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-bg-card rounded-xl p-2 ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={T.cards.dragToReorder}
        className="text-text-secondary/30 hover:text-text-secondary/70 cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <IconGripVertical className="w-4 h-4" aria-hidden />
      </button>
      {game.ImageIcon && (
        <Image
          src={`https://retroachievements.org${game.ImageIcon}`}
          alt={game.Title}
          width={32}
          height={32}
          className="rounded shrink-0"
        />
      )}
      <span className="text-sm truncate flex-1">{game.Title}</span>
      {game.HardcoreMode === '1' && (
        <span className="w-2 h-2 bg-warning rounded-full shrink-0" title="Hardcore" />
      )}
    </div>
  )
}
