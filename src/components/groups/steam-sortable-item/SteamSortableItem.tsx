'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconClock, IconGripVertical, IconX } from '@tabler/icons-react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamGameItemAchievements from '@/components/steam/steam-game-item/steam-game-item-achievements/SteamGameItemAchievements'
import { formatPlaytime } from '@/utils/steamFeed'
import { useSpotlight } from '@/hooks/useSpotlight'
import { steamAssetUrl } from '@/lib/steamClient'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { relativeTime } from '@/utils/utils'
import type { GameGroupItem } from '@/types/types'

/**
 * A Steam game in a group — SortableItem's counterpart: drag handle, cover,
 * title, Steam chip, "x / y achievements", bar, playtime, last played, a
 * remove button, and the badge grid when expanded.
 *
 * Progress comes live from the shared Steam library; the counts stored when
 * the game was added are the fallback (library still loading, or the game
 * has left it). Sorted by the item's row id, like RA items.
 */
export default function SteamSortableItem({
  item,
  onRemove,
  draggable,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
}) {
  const { T, lang } = useLanguage()
  const { library, recent } = useSteamGamesData()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const onPointerMove = useSpotlight()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !draggable,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const game = library.find((g) => g.id === item.game_id) ?? recent.find((g) => g.id === item.game_id) ?? null
  const href = `/steamGame/${item.game_id}`

  const live = game?.achievementsLoaded ?? false
  const earned = live ? game!.numAwarded : item.num_awarded
  const total = live ? game!.maxPossible : item.max_possible
  const hasCounts = total > 0
  const pct = hasCounts ? Math.min((earned / total) * 100, 100) : 0
  const isComplete = hasCounts && earned >= total
  const hasStats = game?.hasStats ?? true

  let progressText: string
  if (hasCounts) progressText = `${earned} / ${total} ${T.steam.achievements}`
  else if (!hasStats) progressText = T.steam.noAchievements
  else progressText = T.steam.progressUnknown

  return (
    <div
      ref={setNodeRef}
      style={style}
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-card w-full rounded-2xl overflow-hidden ring-1 ring-ink/5 hover:ring-ink/15 transition-shadow group ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      {/* The same blurred art and pointer glow as the game cards in the status lists. */}
      <GameCardBackdrop src={steamAssetUrl(item.game_id, 'header')} surface="card" />
      <div className="relative flex items-center gap-3 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            aria-label={T.cards.dragToReorder}
            className="relative z-10 text-text-secondary/40 hover:text-text-secondary transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none self-stretch flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
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
            isComplete ? 'ring-2 ring-[#a4d007]/70 hover:ring-[#a4d007]' : 'hover:ring-2 hover:ring-ink/40'
          }`}
        >
          <SteamGameImage
            appId={item.game_id}
            asset="icon"
            iconUrl={game?.imageIcon ?? item.image_icon ?? ''}
            size={96}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl block"
          />
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={href}
            className="relative z-10 self-start max-w-full hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
          >
            <p title={game?.title ?? item.title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">{game?.title ?? item.title}</p>
          </Link>
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#1b2838] text-[#66c0f4]">
              <SteamLogo size={12} aria-hidden="true" />
              Steam
            </span>
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#a4d007]/10 text-[#a4d007]">
                <span aria-hidden="true">★</span> {T.steam.perfect}
              </span>
            )}
          </span>
          <span className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>{progressText}</span>
          {hasCounts && (
            <span className="flex items-center gap-2 mt-1">
              <SteamProgressBar pct={pct} label={item.title} trackClass="bg-bg-main" className="flex-1" />
              <span className="text-xs text-text-secondary tabular-nums">{Math.round(pct)}%</span>
            </span>
          )}
          {/* Kept when there is nothing to show, so every card is the same height. */}
          <span aria-hidden={game ? undefined : true} className="flex items-center gap-1 text-xs text-text-secondary mt-1">
            {game ? (
              <>
                <IconClock size={12} aria-hidden="true" />
                {T.steam.playtime} ·{' '}
                {formatPlaytime(game.playtimeForever, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
              </>
            ) : (
              '\u00a0'
            )}
          </span>
          <span className="text-xs text-text-secondary mt-1">
            {game?.lastPlayed ? T.groups.playedAgo.replace('{when}', relativeTime(game.lastPlayed, lang)) : T.groups.neverPlayed}
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
            aria-label={`${open ? T.steam.hideAchievements : T.steam.showAchievements}: ${item.title}`}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-main cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
          >
            <span aria-hidden="true" className="block text-xs transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id={panelId} className="border-t border-bg-main px-4 py-4">
          {hasStats ? (
            <SteamGameItemAchievements appId={item.game_id} gameTitle={item.title} expectedCount={hasCounts ? total : undefined} badgeSize={48} limit={60} />
          ) : (
            <p className="text-center text-text-secondary text-sm py-2">{T.steam.noAchievements}</p>
          )}
        </div>
      )}
    </div>
  )
}
