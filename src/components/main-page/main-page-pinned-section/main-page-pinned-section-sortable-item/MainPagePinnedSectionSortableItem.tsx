'use client'

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * One tile of a reorderable pinned grid. The tile itself stays a link or a
 * button; only its grip drags (with the pointer, or Space and the arrows from
 * the keyboard), so a click still opens it. The grip is handed to the tile to
 * place where it fits.
 */
export default function MainPagePinnedSectionSortableItem({
  id,
  label,
  children,
}: {
  id: string
  /** What is being moved, for the grip's accessible name. */
  label: string
  children: (handle: ReactNode) => ReactNode
}) {
  const { T } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`${T.cards.dragToReorder}: ${label}`}
      title={T.cards.dragToReorder}
      className="text-text-secondary/50 hover:text-text-main cursor-grab active:cursor-grabbing touch-none rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <IconGripVertical className="w-4 h-4" aria-hidden="true" />
    </button>
  )

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative h-full ${isDragging ? 'z-10 opacity-70 shadow-2xl' : ''}`}
    >
      {children(handle)}
    </li>
  )
}
