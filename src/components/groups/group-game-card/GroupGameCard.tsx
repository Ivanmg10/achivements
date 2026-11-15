'use client'

import { useId, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { relativeTime } from '@/utils/dates'
import type { GroupGameCardProps } from '@/types/gameCard'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import GameCardCover from '@/components/game-card-cover/GameCardCover'
import GameCardTitle from '@/components/game-card-title/GameCardTitle'
import GameCardProgress from '@/components/game-card-progress/GameCardProgress'
import GameCardExpandButton from '@/components/game-card-expand-button/GameCardExpandButton'
import Facts from '@/components/ui/Facts'

/**
 * A game in a group, for every platform: drag handle, cover, title, chips, progress, one detail line,
 * when it was played and when it joined the group, a remove button, and the achievements that slide
 * open under it. What a platform tells (its numbers, chips and panel) is its adapter's: SortableItem
 * (RA), SteamSortableItem, PsnSortableItem, XboxSortableItem. The whole header opens the panel (a real
 * button, stretched over it); the title and cover open the game, and the handle and the remove button
 * sit above the stretched area.
 */
export default function GroupGameCard({
  item,
  onRemove,
  draggable,
  href,
  title,
  backdrop,
  cover,
  ring,
  chips,
  progress,
  detail,
  lastPlayed,
  fact = false,
  expand,
  panel,
}: GroupGameCardProps) {
  const { T, lang } = useLanguage()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  // The panel is built the first time it opens and kept, so closing it slides instead of vanishing.
  const [opened, setOpened] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !draggable })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const played = lastPlayed ? T.groups.playedAgo.replace('{when}', relativeTime(lastPlayed, lang)) : T.groups.neverPlayed
  const added = T.groups.addedAgo.replace('{when}', relativeTime(item.added_at, lang))

  function toggle() {
    setOpen((o) => !o)
    setOpened(true)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative isolate bg-bg-card w-full rounded-card overflow-hidden ring-1 ring-ink/5 hover:ring-ink/15 transition-shadow group ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      <GameCardBackdrop src={backdrop} surface="card" />
      <div className="relative flex items-center gap-3 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            aria-label={T.cards.dragToReorder}
            className="relative z-10 text-text-secondary/40 hover:text-text-secondary transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none self-stretch flex items-center rounded focus-ring"
          >
            <IconGripVertical className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        <GameCardCover href={href} ring={ring}>{cover}</GameCardCover>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <GameCardTitle href={href} title={title} />
          {chips && <span className="flex items-center gap-1.5 flex-wrap">{chips}</span>}
          <GameCardProgress progress={progress} label={item.title} />
          {detail ?? <span aria-hidden="true" className="text-xs mt-1">{' '}</span>}
          <span className="text-xs text-text-secondary mt-1">
            <Facts items={[played, fact, added]} />
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0 self-start sm:self-center -mr-2 sm:mr-0">
          <button
            onClick={() => onRemove(item.id)}
            aria-label={`${T.groups.removeGame}: ${item.title}`}
            className="relative z-10 p-2 rounded-chip text-text-secondary hover:text-danger hover:bg-danger/10 transition-all [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/70"
          >
            <IconX className="w-4 h-4" aria-hidden="true" />
          </button>
          <GameCardExpandButton open={open} panelId={panelId} label={`${open ? expand.hide : expand.show}: ${item.title}`} onToggle={toggle} />
        </div>
      </div>

      {/* Slides open; inert while shut, so nothing hidden in it can take focus. */}
      <div
        id={panelId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-bg-main px-4 py-4">{opened && panel(open)}</div>
        </div>
      </div>
    </div>
  )
}
