'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical, IconX } from '@tabler/icons-react'
import { relativeTime } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import { useGameProgression } from '@/hooks/useGameProgression'
import { useSpotlight } from '@/hooks/useSpotlight'
import { RetroAchievement, GameGroupItem } from '@/types/types'
import { CONSOLES } from '@/constants'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import { SectionFallback } from '@/components/ui/SectionFallback'
import { AchievementGrid } from '@/components/achievement-grid/AchievementGrid'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'

// About three rows on a wide card; the rest is a click away.
const ACHIEVEMENT_LIMIT = 60

/**
 * An RA game in a group: drag handle, cover, title, console, progress, points,
 * when it was played and when it joined the group. The whole header opens its
 * achievements (a real button, stretched over it); the title and cover open
 * the game, and the handle and remove button sit above the stretched area.
 */
export default function SortableItem({
  item,
  onRemove,
  draggable,
  achStats,
  ptsStats,
  lastPlayed,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
  achStats?: { scEarned: number; hcEarned: number; total: number }
  ptsStats?: { earned: number; total: number }
  lastPlayed?: string
}) {
  const { T, lang } = useLanguage()
  const onPointerMove = useSpotlight()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !draggable })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const consoleDef = CONSOLES.find((c) => c.name === item.console_name)
  const href = `/gameInfo/${item.game_id}`
  const cover = item.image_icon ? `https://retroachievements.org${item.image_icon}` : null

  const achTotal = achStats?.total || item.max_possible
  const scEarned = achStats?.scEarned ?? item.num_awarded
  const hcEarned = achStats?.hcEarned ?? 0
  const scPct = achTotal > 0 ? Math.min(Math.round((scEarned / achTotal) * 100), 100) : Math.min(Math.round(parseFloat(item.pct_won) * 100), 100)
  const hcPct = achTotal > 0 ? Math.min(Math.round((hcEarned / achTotal) * 100), 100) : 0
  const pct = Math.max(scPct, hcPct)
  const isComplete = pct >= 100
  const ptsEarned = ptsStats?.earned ?? item.points_won
  const ptsTotal = ptsStats?.total || item.max_points

  // Asked for on first open; the hook keeps the result when the row closes again.
  const { game: gameData, isLoading, error: achError, refetch: refetchAch } = useGameProgression(open ? String(item.game_id) : null)
  const loadingAch = isLoading || (open && !gameData && !achError)
  const achievements = gameData
    ? Object.values(gameData.Achievements ?? {})
        .filter((a): a is RetroAchievement => !!a)
        .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
    : []

  const played = lastPlayed ? T.groups.playedAgo.replace('{when}', relativeTime(lastPlayed, lang)) : T.groups.neverPlayed
  const added = T.groups.addedAgo.replace('{when}', relativeTime(item.added_at, lang))

  return (
    <div
      ref={setNodeRef}
      style={style}
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-card w-full rounded-2xl overflow-hidden ring-1 ring-ink/5 hover:ring-ink/15 transition-shadow group ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      <GameCardBackdrop src={cover} surface="card" />
      <div className="relative flex items-center gap-3 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            className="relative z-10 text-text-secondary/40 hover:text-text-secondary transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none self-stretch flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            aria-label={T.cards.dragToReorder}
          >
            <IconGripVertical className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* Same destination as the title link, so it is kept out of the tab order. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0 rounded-xl hover:ring-2 hover:ring-ink/40 transition-all">
          {cover ? (
            <Image src={cover} alt="" width={96} height={96} className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl object-cover block" unoptimized />
          ) : (
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-bg-main" />
          )}
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={href}
            className="relative z-10 self-start max-w-full hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <p title={item.title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">{item.title}</p>
          </Link>
          {item.console_name && (
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium self-start ${consoleDef?.color ?? 'bg-bg-main text-text-secondary'}`}>
              {consoleDef?.icon && <Image src={consoleDef.icon} alt="" width={12} height={12} className="w-3 h-3 object-contain shrink-0" />}
              {item.console_name}
            </span>
          )}
          <p className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>
            {achTotal > 0 ? `${Math.max(scEarned, hcEarned)} / ${achTotal}` : achTotal} {T.statusGameItem.achievements}
          </p>
          {achTotal > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <DualProgressBar
                softcorePct={isComplete ? 0 : scPct}
                hardcorePct={isComplete ? 0 : hcPct}
                trackClass={isComplete ? 'bg-green-500/20' : 'bg-bg-main'}
                className="flex-1"
              />
              <span className="text-xs text-text-secondary tabular-nums">{pct}%</span>
            </div>
          )}
          {/* Kept when there is nothing to show, so every card is the same height. */}
          <p aria-hidden={ptsTotal > 0 ? undefined : true} className="text-xs text-text-secondary mt-1">
            {ptsTotal > 0 ? `${ptsEarned} / ${ptsTotal} ${T.statusGameItem.pointsEarned}` : '\u00a0'}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {played} · {added}
          </p>
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
            className="p-1.5 rounded-lg text-text-secondary/50 hover:text-text-secondary cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <span aria-hidden="true" className="block text-xs transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* Slides open; inert while shut, so nothing hidden in it can take focus. */}
      <div
        id={panelId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-bg-main px-4 py-4">
            {loadingAch ? (
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: Math.min(achTotal || 12, 60) }).map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg bg-bg-main animate-pulse" />
                ))}
              </div>
            ) : achError && !gameData ? (
              <SectionFallback error onRefresh={refetchAch}>{null}</SectionFallback>
            ) : achievements.length === 0 ? (
              open && <p className="text-center text-text-secondary text-sm py-2">{T.statusGameItem.noPublishedAchievements}</p>
            ) : (
              <AchievementGrid
                achievements={achievements}
                total={achTotal}
                numDistinctPlayers={gameData?.NumDistinctPlayers ?? 1}
                gameId={item.game_id}
                gameTitle={item.title}
                badgeSize={48}
                limit={ACHIEVEMENT_LIMIT}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
