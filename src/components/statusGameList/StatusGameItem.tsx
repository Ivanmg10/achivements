'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, useRef, useState } from 'react'
import { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import { CategoryGame } from '../../hooks/useGamesByCategory'
import { useLanguage } from '@/context/LanguageContext'

function getGameId(g: CategoryGame): number | string {
  return g.ID ?? g.GameID!
}

function getAchievementMeta(g: CategoryGame): { earned: number | null; total: number; pct: number | null } {
  if ('AchievementsPublished' in g) {
    return { earned: null, total: g.AchievementsPublished, pct: null }
  }
  const pct = parseFloat(g.PctWon) * 100
  return { earned: g.NumAwarded, total: g.MaxPossible, pct }
}

type TooltipData = { achievement: RetroAchievement; x: number; y: number }

// Memoized so tooltip state changes don't re-render StatusGameItem
const AchievementGrid = memo(function AchievementGrid({
  achievements,
}: {
  achievements: RetroAchievement[]
}) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { T } = useLanguage()

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression:   { label: T.achievement.progression, className: 'bg-blue-900/60 text-blue-300' },
    win_condition: { label: T.achievement.completed,   className: 'bg-yellow-900/60 text-yellow-300' },
    missable:      { label: T.achievement.missable,    className: 'bg-red-900/60 text-red-300' },
  }

  function handleEnter(a: RetroAchievement, x: number, y: number) {
    hoverTimeout.current = setTimeout(() => setTooltip({ achievement: a, x, y }), 450)
  }

  function handleLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setTooltip(null)
  }

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {achievements.map((a) => {
          const isHardcore = !!a.DateEarnedHardcore
          const isSoftcore = !!a.DateEarned && !a.DateEarnedHardcore
          const earnedAny = isHardcore || isSoftcore

          return (
            <div
              key={a.ID}
              onMouseEnter={(e) => handleEnter(a, e.clientX, e.clientY)}
              onMouseLeave={handleLeave}
              className={`rounded-lg overflow-hidden shrink-0 transition-transform duration-100 hover:scale-125 hover:z-10 relative cursor-default ${
                isHardcore ? 'ring-2 ring-yellow-400' : isSoftcore ? 'ring-2 ring-blue-400' : ''
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

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-bg-card border border-bg-header/80 rounded-xl shadow-2xl p-3 max-w-65"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <p className="text-sm font-semibold text-text-main">{tooltip.achievement.Title}</p>
          <p className="text-xs text-text-secondary mt-1 leading-snug">
            {tooltip.achievement.Description}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-text-secondary">{tooltip.achievement.Points} pts</span>
            {tooltip.achievement.Type && TYPE_BADGES[tooltip.achievement.Type] && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_BADGES[tooltip.achievement.Type].className}`}>
                {TYPE_BADGES[tooltip.achievement.Type].label}
              </span>
            )}
            {tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">
                Hardcore
              </span>
            )}
            {tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300">
                Softcore
              </span>
            )}
            {!tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs text-text-secondary/60">{T.achievement.notEarned}</span>
            )}
          </div>
          {(tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned) && (
            <p className="text-xs text-text-secondary/60 mt-1">
              {new Date(
                (tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned)!,
              ).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </>
  )
})

export default function StatusGameItem({ game }: { game: CategoryGame }) {
  const [open, setOpen] = useState(false)
  const [gameData, setGameData] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [loading, setLoading] = useState(false)
  const { T } = useLanguage()

  const gameId = getGameId(game)
  const { earned, total, pct } = getAchievementMeta(game)
  const isComplete = earned !== null && earned === total && total > 0

  async function handleToggle() {
    if (!open && !gameData) {
      setOpen(true)
      setLoading(true)
      const data = await fetch(`/api/getGameProgression?gameId=${gameId}`).then((r) => r.json())
      setGameData(data)
      setLoading(false)
    } else {
      setOpen((o) => !o)
    }
  }

  const achievements = gameData
    ? Object.values(gameData.Achievements ?? {})
        .filter((a): a is RetroAchievement => !!a)
        .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
    : []

  return (
    <div className="bg-bg-card w-[95%] rounded-xl overflow-hidden">
      <div
        onClick={handleToggle}
        className="flex flex-row items-center gap-4 p-4 cursor-pointer hover:bg-bg-header/20 transition-colors select-none"
      >
        <Link
          href={`/gameInfo/${gameId}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 hover:ring-2 hover:ring-white/40 rounded-xl transition-all duration-150"
        >
          <Image
            src={`https://retroachievements.org${game.ImageIcon}`}
            alt={game.Title}
            width={80}
            height={80}
            className="w-20 h-20 rounded-xl object-cover block"
          />
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={`/gameInfo/${gameId}`}
            onClick={(e) => e.stopPropagation()}
            className="self-start hover:underline decoration-white/50 underline-offset-2"
          >
            <p className="text-xl font-semibold leading-tight">{game.Title}</p>
          </Link>
          <p className="text-sm text-text-secondary">{game.ConsoleName}</p>
          <span
            className={`self-start text-sm font-semibold px-2.5 py-0.5 rounded-lg mt-0.5 ${
              isComplete ? 'bg-green-800/60 text-green-300' : 'bg-bg-main text-text-main'
            }`}
          >
            {earned !== null ? `${earned} / ${total}` : total} {T.statusGameItem.achievements}
          </span>
          {pct !== null && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-36 h-1.5 bg-bg-main rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-text-secondary whitespace-nowrap">{Math.round(pct)}%</span>
            </div>
          )}
        </div>

        <span
          className="text-text-secondary text-xs shrink-0 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-bg-main px-4 py-4">
            {loading ? (
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: total > 0 ? total : 12 }).map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg bg-bg-main animate-pulse" />
                ))}
              </div>
            ) : achievements.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-2">{T.statusGameItem.noPublishedAchievements}</p>
            ) : (
              <AchievementGrid achievements={achievements} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
