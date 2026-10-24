'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical, IconX } from '@tabler/icons-react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameIcon from '@/components/game-icon/GameIcon'
import XboxGameItemAchievements from '@/components/xbox/xbox-game-item-achievements/XboxGameItemAchievements'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { useSpotlight } from '@/hooks/useSpotlight'
import { gameHref } from '@/utils/gameRef'
import { xboxBackdrop, xboxPlatformChip, xboxTitleId } from '@/utils/xboxTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import { relativeTime } from '@/utils/utils'
import type { GameGroupItem } from '@/types/types'

/**
 * An Xbox game in a group — PsnSortableItem's counterpart: drag handle, icon,
 * title, platform chip, "x / y achievements", bar, gamerscore, last played, a
 * remove button, and the achievement grid when expanded.
 *
 * Progress comes live from the shared Xbox library; the counts stored when the
 * game was added are the fallback (library still loading, or Xbox unlinked).
 */
export default function XboxSortableItem({
  item,
  onRemove,
  draggable,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
}) {
  const { T, lang } = useLanguage()
  const { fullLibrary } = useXboxGamesData()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const onPointerMove = useSpotlight()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !draggable,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const game = fullLibrary.find((g) => g.id === item.game_id) ?? null
  const href = gameHref('xbox', item.game_id)
  const earned = game ? game.numAwarded : item.num_awarded
  // A newer game may not say how many achievements it has; then only what is earned is written.
  const totalKnown = game ? game.totalKnown : item.max_possible > 0
  const total = game ? game.maxPossible : item.max_possible
  const pct = game ? game.pctWon : Math.round(parseFloat(item.pct_won) * 100) || 0
  const isComplete = pct >= 100
  const icon = game?.imageIcon ?? item.image_icon ?? null
  const progressText = totalKnown
    ? T.xbox.achievementsProgress.replace('{earned}', String(earned)).replace('{total}', String(total))
    : T.xbox.achievementsEarned.replace('{earned}', String(earned))

  return (
    <div
      ref={setNodeRef}
      style={style}
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-card w-full rounded-2xl overflow-hidden ring-1 ring-ink/5 hover:ring-ink/15 transition-shadow group ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      <GameCardBackdrop src={game ? xboxBackdrop(game) : icon} surface="card" />
      <div className="relative flex items-center gap-3 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            aria-label={T.cards.dragToReorder}
            className="relative z-10 text-text-secondary/40 hover:text-text-secondary transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none self-stretch flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
          >
            <IconGripVertical className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className={`relative z-10 shrink-0 rounded-xl transition-all ${
            isComplete ? 'ring-2 ring-success/70 hover:ring-success' : 'hover:ring-2 hover:ring-ink/40'
          }`}
        >
          <GameIcon source="xbox" id={item.game_id} imageUrl={icon} size={96} className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl block" />
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={href}
            className="relative z-10 self-start max-w-full hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
          >
            <p title={game?.title ?? item.title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">
              {game?.title ?? item.title}
            </p>
          </Link>
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${xboxPlatformChip(game?.consoleName ?? '')}`}>
              <XboxLogo size={12} aria-hidden="true" />
              {game?.consoleName || 'Xbox'}
            </span>
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                <span aria-hidden="true">★</span> {T.steam.perfect}
              </span>
            )}
          </span>
          <span className={`text-sm mt-0.5 ${isComplete ? 'text-success' : 'text-text-secondary'}`}>{progressText}</span>
          {(totalKnown || pct > 0) && (
            <span className="flex items-center gap-2 mt-1">
              <ProgressBar pct={pct} label={item.title} trackClass="bg-bg-main" className="flex-1" />
              <span className={`text-xs tabular-nums ${pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{Math.round(pct)}%</span>
            </span>
          )}
          {/* Kept when there is nothing to show, so every card is the same height. */}
          {game ? <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="mt-1" /> : <span aria-hidden="true" className="text-xs mt-1">{' '}</span>}
          <span className="text-xs text-text-secondary mt-1">
            {game?.lastPlayed ? T.groups.playedAgo.replace('{when}', relativeTime(game.lastPlayed, lang)) : T.groups.neverPlayed}
            {game?.playtimeMinutes != null && ` · ${T.steam.playtime} ${formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}`}
            {' · '}
            {T.groups.addedAgo.replace('{when}', relativeTime(item.added_at, lang))}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0 self-start sm:self-center -mr-2 sm:mr-0">
          <button
            onClick={() => onRemove(item.id)}
            aria-label={`${T.groups.removeGame}: ${item.title}`}
            className="relative z-10 p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-all [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/70"
          >
            <IconX className="w-4 h-4" aria-hidden="true" />
          </button>
          {/* The expand control: a real button, its hit area stretched over the whole header. */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? T.xbox.hideAchievements : T.xbox.showAchievements}: ${item.title}`}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-main cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
          >
            <span aria-hidden="true" className="block text-xs transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id={panelId} className="border-t border-bg-main px-4 py-4">
          <XboxGameItemAchievements gameId={item.game_id} titleId={xboxTitleId(item.game_id)} gameTitle={item.title} expectedCount={total || undefined} badgeSize={48} limit={60} />
        </div>
      )}
    </div>
  )
}
