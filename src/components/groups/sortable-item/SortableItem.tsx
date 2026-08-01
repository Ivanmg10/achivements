'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence } from 'framer-motion'
import {
  IconGripVertical,
  IconX,
} from '@tabler/icons-react'
import { relativeTime } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievement, RetroAchievementsGameWithAchievements, GameGroupItem } from '@/types/types'
import { CONSOLES } from '@/constants'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import AchievementModal from '@/components/achievement-modal/AchievementModal'

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
  const { T } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !draggable,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const consoleDef = CONSOLES.find((c) => c.name === item.console_name)
  const consoleIcon = consoleDef?.icon
  const consoleColor = consoleDef?.color

  const achTotal = achStats?.total || item.max_possible
  const scEarned = achStats?.scEarned ?? item.num_awarded
  const hcEarned = achStats?.hcEarned ?? 0
  const scPct = achTotal > 0
    ? Math.min(Math.round((scEarned / achTotal) * 100), 100)
    : Math.min(Math.round(parseFloat(item.pct_won) * 100), 100)
  const hcPct = achTotal > 0 ? Math.min(Math.round((hcEarned / achTotal) * 100), 100) : 0
  const pct = Math.max(scPct, hcPct)
  const isComplete = pct >= 100
  const ptsEarned = ptsStats?.earned ?? item.points_won
  const ptsTotal = ptsStats?.total || item.max_points

  const [open, setOpen] = useState(false)
  const [gameData, setGameData] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [loadingAch, setLoadingAch] = useState(false)
  const [selectedAch, setSelectedAch] = useState<RetroAchievement | null>(null)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())
  const [tooltip, setTooltip] = useState<{ achievement: RetroAchievement; x: number; y: number } | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleAchEnter(a: RetroAchievement, x: number, y: number) {
    hoverTimeout.current = setTimeout(() => setTooltip({ achievement: a, x, y }), 450)
  }
  function handleAchLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setTooltip(null)
  }

  useEffect(() => {
    if (!open || favoritedIds.size > 0) return
    fetch(`/api/favorites?gameId=${item.game_id}`)
      .then((r) => r.json())
      .then((rows: { achievement_id: number }[]) =>
        setFavoritedIds(new Set(rows.map((r) => r.achievement_id)))
      )
      .catch(() => {})
  }, [open, item.game_id, favoritedIds.size])

  async function handleToggle() {
    if (!open && !gameData) {
      setOpen(true)
      setLoadingAch(true)
      const data = await fetch(`/api/getGameProgression?gameId=${item.game_id}`).then((r) =>
        r.json()
      )
      setGameData(data)
      setLoadingAch(false)
    } else {
      setOpen((o) => !o)
    }
  }

  async function handleToggleFavorite(achievement: RetroAchievement) {
    const isFav = favoritedIds.has(achievement.ID)
    setFavoritedIds((prev) => {
      const next = new Set(prev)
      isFav ? next.delete(achievement.ID) : next.add(achievement.ID)
      return next
    })
    if (isFav) {
      await fetch(`/api/favorites?achievementId=${achievement.ID}`, { method: 'DELETE' })
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievement,
          gameId: item.game_id,
          gameTitle: item.title,
          numDistinctPlayers: gameData?.NumDistinctPlayers ?? 1,
        }),
      })
    }
  }

  const achievements = gameData
    ? Object.values(gameData.Achievements ?? {})
        .filter((a): a is RetroAchievement => !!a)
        .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
    : []

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-bg-card w-full rounded-xl overflow-hidden hover:ring-1 hover:ring-white/10 transition-shadow group ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      {/* Main row — clickable to expand */}
      <div
        onClick={handleToggle}
        className="flex items-center gap-3 p-5 cursor-pointer hover:bg-bg-header/20 transition-colors select-none"
      >
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-text-secondary/30 hover:text-text-secondary/70 transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none self-stretch flex items-center"
            aria-label="Drag to reorder"
          >
            <IconGripVertical className="w-4 h-4" aria-hidden />
          </button>
        )}

        <Link
          href={`/gameInfo/${item.game_id}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-xl hover:ring-2 hover:ring-white/40 transition-all"
        >
          {item.image_icon ? (
            <Image
              src={`https://retroachievements.org${item.image_icon}`}
              alt={item.title}
              width={96}
              height={96}
              className="w-24 h-24 rounded-xl object-cover block"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-bg-main" />
          )}
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={`/gameInfo/${item.game_id}`}
            onClick={(e) => e.stopPropagation()}
            className="self-start hover:underline decoration-white/50 underline-offset-2"
          >
            <p className="text-xl font-semibold leading-tight">{item.title}</p>
          </Link>
          {item.console_name && (
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium self-start ${consoleColor ?? 'bg-bg-main text-text-secondary/70'}`}>
              {consoleIcon && (
                <Image
                  src={consoleIcon}
                  alt={item.console_name}
                  width={12}
                  height={12}
                  className="w-3 h-3 object-contain shrink-0"
                />
              )}
              {item.console_name}
            </span>
          )}
          <p className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>
            {achTotal > 0 ? `${Math.max(scEarned, hcEarned)} / ${achTotal}` : '—'} {T.statusGameItem.achievements}
          </p>
          {achTotal > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <DualProgressBar
                softcorePct={isComplete ? 0 : scPct}
                hardcorePct={isComplete ? 0 : hcPct}
                trackClass={isComplete ? 'bg-green-500/20' : 'bg-bg-main'}
                className="w-40"
              />
              <span className="text-xs text-text-secondary/60 tabular-nums">{pct}%</span>
            </div>
          )}
          <p className="text-xs text-text-secondary/60 mt-1">
            {ptsTotal > 0 ? `${ptsEarned} / ${ptsTotal} ${T.statusGameItem.pointsEarned}` : '—'}
          </p>
          <p className="text-xs text-text-secondary/60 mt-1">
            {lastPlayed ? relativeTime(lastPlayed) : 'No lo has jugado aun'}
            <span className="text-text-secondary/40"> · +{relativeTime(item.added_at)}</span>
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
            className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
            aria-label="Remove game"
          >
            <IconX className="w-4 h-4" aria-hidden />
          </button>
          <span
            className="text-text-secondary/50 text-xs transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Accordion */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-bg-main px-4 py-4">
            {loadingAch ? (
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg bg-bg-main animate-pulse" />
                ))}
              </div>
            ) : achievements.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-2">
                {T.statusGameItem.noPublishedAchievements}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {achievements.map((a) => {
                  const isHardcore = !!a.DateEarnedHardcore
                  const isSoftcore = !!a.DateEarned && !a.DateEarnedHardcore
                  const earnedAny = isHardcore || isSoftcore
                  return (
                    <div
                      key={a.ID}
                      onMouseEnter={(e) => handleAchEnter(a, e.clientX, e.clientY)}
                      onMouseLeave={handleAchLeave}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAchLeave()
                        setSelectedAch(a)
                      }}
                      className={`rounded-lg overflow-hidden shrink-0 transition-transform duration-100 hover:scale-125 hover:z-10 relative cursor-pointer ${
                        isHardcore
                          ? 'ring-2 ring-yellow-400'
                          : isSoftcore
                            ? 'ring-2 ring-blue-400'
                            : ''
                      }`}
                    >
                      <Image
                        src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                        alt={a.Title}
                        width={48}
                        height={48}
                        className={`w-12 h-12 object-cover ${earnedAny ? '' : 'grayscale opacity-40'}`}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAch && (
          <AchievementModal
            achievement={selectedAch}
            numDistinctPlayers={gameData?.NumDistinctPlayers ?? 1}
            onClose={() => setSelectedAch(null)}
            gameId={item.game_id}
            isFavorited={favoritedIds.has(selectedAch.ID)}
            onToggleFavorite={() => handleToggleFavorite(selectedAch)}
          />
        )}
      </AnimatePresence>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-bg-card border border-bg-header/80 rounded-xl shadow-2xl p-3 max-w-65"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <p className="text-sm font-semibold text-text-main">{tooltip.achievement.Title}</p>
          <p className="text-xs text-text-secondary mt-1 leading-snug">{tooltip.achievement.Description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-text-secondary">{tooltip.achievement.Points} pts</span>
            {tooltip.achievement.Type === 'progression' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300">Progression</span>
            )}
            {tooltip.achievement.Type === 'win_condition' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">Win condition</span>
            )}
            {tooltip.achievement.Type === 'missable' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-900/60 text-red-300">Missable</span>
            )}
            {tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">Hardcore</span>
            )}
            {tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300">Softcore</span>
            )}
            {!tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs text-text-secondary/60">{T.achievement.notEarned}</span>
            )}
          </div>
          {(tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned) && (
            <p className="text-xs text-text-secondary/60 mt-1">
              {new Date((tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned)!).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
