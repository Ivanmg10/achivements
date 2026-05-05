'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, useEffect, useRef, useState } from 'react'
import { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import { CategoryGame } from '../../hooks/useGamesByCategory'
import { GameExtraData } from './StatusGameList'
import { useLanguage } from '@/context/LanguageContext'
import AchievementModal from '../achievement-modal/AchievementModal'
import { CONSOLES } from '@/constants'
import { relativeTime } from '@/utils/utils'

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
  numDistinctPlayers,
}: {
  achievements: RetroAchievement[]
  numDistinctPlayers: number
}) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [selected, setSelected] = useState<RetroAchievement | null>(null)
  const [allLoaded, setAllLoaded] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { T } = useLanguage()

  useEffect(() => {
    if (achievements.length === 0) { setAllLoaded(true); return }
    let count = 0
    const done = () => { count++; if (count >= achievements.length) setAllLoaded(true) }
    achievements.forEach((a) => {
      const img = new window.Image()
      img.onload = done
      img.onerror = done
      img.src = `https://media.retroachievements.org/Badge/${a.BadgeName}.png`
    })
    const timeout = setTimeout(() => setAllLoaded(true), 1500)
    return () => clearTimeout(timeout)
  }, [achievements])

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
      {!allLoaded && (
        <div className="flex flex-wrap gap-1">
          {achievements.map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-lg bg-bg-main animate-pulse" />
          ))}
        </div>
      )}
      <div className={allLoaded ? 'flex flex-wrap gap-1' : 'hidden'}>
        {achievements.map((a) => {
          const isHardcore = !!a.DateEarnedHardcore
          const isSoftcore = !!a.DateEarned && !a.DateEarnedHardcore
          const earnedAny = isHardcore || isSoftcore

          return (
            <div
              key={a.ID}
              onMouseEnter={(e) => handleEnter(a, e.clientX, e.clientY)}
              onMouseLeave={handleLeave}
              onClick={() => { handleLeave(); setSelected(a) }}
              className={`rounded-lg overflow-hidden shrink-0 transition-transform duration-100 hover:scale-125 hover:z-10 relative cursor-pointer ${
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

      {selected && (
        <AchievementModal
          achievement={selected}
          numDistinctPlayers={numDistinctPlayers}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
})

export default function StatusGameItem({ game, extra, category }: { game: CategoryGame; extra?: GameExtraData; category?: string }) {
  const [open, setOpen] = useState(false)
  const [gameData, setGameData] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [loading, setLoading] = useState(false)
  const { T } = useLanguage()

  const gameId = getGameId(game)
  const { earned, total, pct } = getAchievementMeta(game)
  const isComplete = earned !== null && earned === total && total > 0
  const consoleIcon = CONSOLES.find((c) => c.id === Number(game.ConsoleID))?.icon

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

  const completionDuration = gameData ? (() => {
    const dates = achievements
      .map((a) => a.DateEarnedHardcore ?? a.DateEarned)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime())
    if (dates.length < 2) return null
    const diffMs = Math.max(...dates) - Math.min(...dates)
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 1) return 'less than a minute'
    if (diffHours < 1) return `${diffMins}m`
    if (diffDays < 1) return `${diffHours}h`
    if (diffDays < 30) return `${diffDays}d`
    const months = Math.floor(diffDays / 30)
    return `${months}mo`
  })() : null

  const isHardcore = 'HardcoreMode' in game && Number(game.HardcoreMode) === 1

  return (
    <div className="bg-bg-card w-full rounded-xl overflow-hidden hover:ring-1 hover:ring-white/10 transition-shadow duration-150">
      <div
        onClick={handleToggle}
        className="flex flex-row items-center gap-5 p-5 cursor-pointer hover:bg-bg-header/20 transition-colors select-none"
      >
        <Link
          href={`/gameInfo/${gameId}`}
          onClick={(e) => e.stopPropagation()}
          className={`shrink-0 rounded-xl transition-all duration-150 ${
            isHardcore ? 'ring-2 ring-yellow-400/70 hover:ring-yellow-400' : 'hover:ring-2 hover:ring-white/40'
          }`}
        >
          {game.ImageIcon && (
            <Image
              src={`https://retroachievements.org${game.ImageIcon}`}
              alt={game.Title}
              width={96}
              height={96}
              className="w-24 h-24 rounded-xl object-cover block"
            />
          )}
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={`/gameInfo/${gameId}`}
            onClick={(e) => e.stopPropagation()}
            className="self-start hover:underline decoration-white/50 underline-offset-2"
          >
            <p className="text-xl font-semibold leading-tight">{game.Title}</p>
          </Link>
          <div className="flex items-center gap-1.5">
            {consoleIcon && (
              <Image src={consoleIcon} alt={game.ConsoleName} width={14} height={14} className="w-3.5 h-3.5 object-contain opacity-60" />
            )}
            <p className="text-xs text-text-secondary/70 uppercase tracking-wide">{game.ConsoleName}</p>
          </div>
          <p className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>
            {earned !== null ? `${earned} / ${total}` : total} {T.statusGameItem.achievements}
          </p>
          {pct !== null && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-40 h-1.5 bg-bg-main rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-text-secondary/60 tabular-nums">{Math.round(pct)}%</span>
            </div>
          )}
          {extra && extra.awards.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {extra.awards.map((award, i) => {
                const date = new Date(award.AwardedAt).toLocaleDateString()
                if (award.AwardType === 'Mastery/Completion') {
                  const isHC = award.AwardDataExtra === 1
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      isHC ? 'bg-yellow-400/10 text-yellow-400/90' : 'bg-green-400/10 text-green-400/90'
                    }`}>
                      {isHC ? '★ Mastered' : '✓ Completed'} · {date}
                    </span>
                  )
                }
                if (award.AwardType === 'Game Beaten') {
                  const isHC = award.AwardDataExtra === 1
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      isHC ? 'bg-yellow-400/10 text-yellow-300/80' : 'bg-blue-400/10 text-blue-400/90'
                    }`}>
                      ⚔ Beaten{isHC ? ' HC' : ''} · {date}
                    </span>
                  )
                }
                return null
              })}
            </div>
          )}
          {(extra || category === 'playing') && (
            <p className="text-xs text-text-secondary/60 mt-1">
              Last played · {extra?.lastPlayed ? new Date(extra.lastPlayed).toLocaleDateString() : 'a long time ago'}
            </p>
          )}
        </div>

        <span
          className="text-text-secondary/50 text-xs shrink-0 transition-transform duration-300"
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
              <div className="flex flex-col gap-3">
                {completionDuration && (
                  <p className="text-xs text-text-secondary/60">
                    First → last unlock: <span className="text-text-secondary/90 font-medium">{completionDuration}</span>
                  </p>
                )}
                <AchievementGrid achievements={achievements} numDistinctPlayers={gameData?.NumDistinctPlayers ?? 1} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
