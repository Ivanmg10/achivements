'use client'

import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { PerfectGame } from '@/utils/perfectGames'
import { PLATFORM_NAME } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import Tag from '@/components/ui/Tag'

/** One draggable game in the reorder list: its platform's logo and, for an RA game, how it was completed in words. */
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
      className={`flex items-center gap-3 bg-bg-card rounded-tile p-2 ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`${T.cards.dragToReorder}: ${game.title}`}
        className="text-text-secondary/30 hover:text-text-secondary cursor-grab active:cursor-grabbing touch-none shrink-0"
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
          unoptimized={game.source !== 'ra'}
        />
      )}
      <span className="text-sm truncate flex-1">{game.title}</span>
      {game.source === 'ra' && (
        <Tag tone={game.hardcore ? 'hardcore' : 'muted'} size="xs" className="shrink-0">
          {game.hardcore ? T.achievement.hardcore : T.achievement.softcore}
        </Tag>
      )}
      <PlatformLogo source={game.source} size={12} label={PLATFORM_NAME[game.source]} className="shrink-0" />

    </div>
  )
}
