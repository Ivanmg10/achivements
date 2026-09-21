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
      className={`bg-bg-card w-full rounded-xl overflow-hidden hover:ring-1 hover:ring-white/10 transition-shadow group ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      <div className="flex items-center gap-3 p-5">
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            aria-label={T.cards.dragToReorder}
            className="text-text-secondary/30 hover:text-text-secondary/70 transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none self-stretch flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
          >
            <IconGripVertical className="w-4 h-4" aria-hidden />
          </button>
        )}

        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className={`shrink-0 rounded-xl transition-all ${
            isComplete ? 'ring-2 ring-[#a4d007]/70 hover:ring-[#a4d007]' : 'hover:ring-2 hover:ring-white/40'
          }`}
        >
          <SteamGameImage
            appId={item.game_id}
            iconUrl={game?.imageIcon ?? item.image_icon ?? ''}
            size={96}
            className="w-24 h-24 rounded-xl block"
          />
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={href}
            className="self-start hover:underline decoration-white/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
          >
            <p className="text-xl font-semibold leading-tight">{game?.title ?? item.title}</p>
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? T.steam.hideAchievements : T.steam.showAchievements}: ${item.title}`}
            className="flex items-center gap-3 w-full text-left rounded select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
          >
            <span className="flex flex-col flex-1 min-w-0 gap-1">
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#1b2838] text-[#66c0f4]">
                  <SteamLogo size={12} aria-hidden="true" />
                  Steam
                </span>
                {isComplete && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#a4d007]/10 text-[#a4d007]">
                    ★ {T.steam.perfect}
                  </span>
                )}
              </span>

              <span className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>
                {progressText}
              </span>

              {hasCounts && (
                <span className="flex items-center gap-2 mt-1">
                  <SteamProgressBar pct={pct} label={item.title} trackClass="bg-bg-main" className="w-40" />
                  <span className="text-xs text-text-secondary/60 tabular-nums">{Math.round(pct)}%</span>
                </span>
              )}

              {game && (
                <span className="flex items-center gap-1 text-xs text-text-secondary/60 mt-1">
                  <IconClock size={12} aria-hidden="true" />
                  {T.steam.playtime} ·{' '}
                  {formatPlaytime(game.playtimeForever, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
                </span>
              )}

              <span className="text-xs text-text-secondary/60 mt-1">
                {T.steam.lastPlayed} ·{' '}
                {game?.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString(lang) : T.steam.neverPlayed}
                <span className="text-text-secondary/40"> · +{relativeTime(item.added_at)}</span>
              </span>
            </span>

            <span
              aria-hidden="true"
              className="text-text-secondary/50 text-xs transition-transform duration-300 shrink-0 self-center"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          aria-label={`${T.groups.removeGame} ${item.title}`}
          className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0"
        >
          <IconX className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {open && (
        <div id={panelId} className="border-t border-bg-main px-4 py-4">
          {hasStats ? (
            <SteamGameItemAchievements appId={item.game_id} expectedCount={hasCounts ? total : undefined} badgeSize={48} />
          ) : (
            <p className="text-center text-text-secondary text-sm py-2">{T.steam.noAchievements}</p>
          )}
        </div>
      )}
    </div>
  )
}
