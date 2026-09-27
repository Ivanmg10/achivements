'use client'

import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { PerfectGame } from '@/utils/perfectGames'
import SteamLogo from '@/components/steam-logo/SteamLogo'

/** One draggable game in the reorder list — RA and Steam games alike. */
export default function PerfectGameOrderRow({ game }: { game: PerfectGame }) {
  const { T } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.key,
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
        aria-label={`${T.cards.dragToReorder}: ${game.title}`}
        className="text-text-secondary/30 hover:text-text-secondary/70 cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <IconGripVertical className="w-4 h-4" aria-hidden />
      </button>
      {game.imageUrl && (
        <Image
          src={game.imageUrl}
          alt=""
          width={32}
          height={32}
          className="rounded shrink-0"
          unoptimized={game.source === 'steam'}
        />
      )}
      <span className="text-sm truncate flex-1">{game.title}</span>
      {game.source === 'steam' ? (
        <SteamLogo size={12} className="text-[#66c0f4] shrink-0" aria-label="Steam" />
      ) : (
        game.hardcore && <span className="w-2 h-2 bg-warning rounded-full shrink-0" title="Hardcore" />
      )}
    </div>
  )
}
