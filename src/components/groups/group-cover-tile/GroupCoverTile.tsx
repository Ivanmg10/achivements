import Image from 'next/image'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconCheck, IconGripVertical, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroupItem } from '@/types/types'
import type { ItemProgress } from '@/utils/groupItems'
import { gameHref } from '@/utils/gameRef'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'

const OVERLAY = 'absolute z-10 p-1.5 rounded-lg bg-bg-main/80 text-text-secondary transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2'

/**
 * A game of a group as a cover: the art (a finished one ringed and marked),
 * its name, its percentage and how much is left. The cover and name open the game; the
 * handle (when the list can be reordered) and the remove button sit on the art.
 */
export default function GroupCoverTile({
  item,
  progress,
  draggable,
  onRemove,
}: {
  item: GameGroupItem
  progress: ItemProgress
  draggable: boolean
  onRemove: (id: number) => void
}) {
  const { T } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !draggable })
  const src = coverSrc(item)
  const href = gameHref(item.source ?? 'ra', item.game_id)
  const pct = Math.min(100, Math.round(progress.pct * 100))
  const done = pct >= 100
  const left = progress.total > 0 ? progress.total - progress.earned : 0
  const status = done ? T.groups.finished : pct === 0 ? T.groups.filter0 : left > 0 ? T.groups.leftCount.replace('{n}', String(left)) : `${pct}%`

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative flex flex-col gap-2 min-w-0 ${isDragging ? 'opacity-50 z-20' : ''}`}
    >
      <div className="relative">
        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className={`block aspect-square rounded-2xl overflow-hidden bg-bg-card ring-2 transition-all ${done ? 'ring-progress' : 'ring-transparent group-hover:ring-ink/30'}`}
        >
          {src && <Image src={src} alt="" width={240} height={240} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />}
        </Link>
        {done && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-bg-main/90 text-success">
            <IconCheck className="w-3 h-3" aria-hidden="true" />
            100%
          </span>
        )}
        {draggable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`${T.cards.dragToReorder}: ${item.title}`}
            className={`${OVERLAY} top-2 left-2 cursor-grab active:cursor-grabbing touch-none hover:text-text-main focus-visible:ring-accent/70`}
          >
            <IconGripVertical className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`${T.groups.removeGame}: ${item.title}`}
          className={`${OVERLAY} top-2 right-2 hover:text-danger focus-visible:ring-danger/70`}
        >
          <IconX className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <Link href={href} title={item.title} className="text-sm font-semibold truncate hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
        {item.title}
      </Link>
      {/* No bar under the cover (the user's choice, 2026-10-24): the percentage and what is left. */}
      <span className="flex items-baseline gap-1.5 min-w-0 text-[11px]">
        <span className={`tabular-nums font-semibold ${done ? 'text-success' : 'text-text-main'}`}>{pct}%</span>
        <span className="text-text-secondary truncate">
          {item.console_name ? `${item.console_name} · ` : ''}
          {status}
        </span>
      </span>
    </li>
  )
}
