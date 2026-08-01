'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import { CategoryGame } from '../../hooks/useGamesByCategory'
import { GameExtraData } from './StatusGameList'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import { relativeTime } from '@/utils/utils'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import { AchievementGrid } from '@/components/achievement-grid/AchievementGrid'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'

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

export default function StatusGameItem({
  game,
  extra,
  category,
  itemRef,
  style,
}: {
  game: CategoryGame
  extra?: GameExtraData
  category?: string
  itemRef?: (el: HTMLDivElement | null) => void
  style?: CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [gameData, setGameData] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [loading, setLoading] = useState(false)
  const { T } = useLanguage()

  const gameId = getGameId(game)
  const { earned, total, pct } = getAchievementMeta(game)
  const isComplete = earned !== null && earned === total && total > 0
  const consoleDef = CONSOLES.find((c) => c.id === Number(game.ConsoleID))
  const consoleIcon = consoleDef?.icon
  const consoleColor = consoleDef?.color

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
    <div
      ref={itemRef}
      style={style}
      className="bg-bg-card rounded-xl overflow-hidden hover:ring-1 hover:ring-white/10 transition-shadow duration-150"
    >
      <div
        onClick={handleToggle}
        className="flex flex-row items-start gap-5 p-5 cursor-pointer hover:bg-bg-header/20 transition-colors select-none"
      >
        <Link
          href={`/gameInfo/${gameId}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          {game.ImageIcon && (
            <div
              className={`w-24 h-24 rounded-xl overflow-hidden transition-all duration-150 ${
                isHardcore ? 'ring-2 ring-yellow-400/70 hover:ring-yellow-400' : 'hover:ring-2 hover:ring-white/40'
              }`}
            >
              <Image
                src={`https://retroachievements.org${game.ImageIcon}`}
                alt={game.Title}
                width={96}
                height={96}
                className="w-24 h-24 rounded-xl object-cover block"
              />
            </div>
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
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${consoleColor ?? 'bg-bg-main text-text-secondary/70'}`}>
              {consoleIcon && (
                <Image src={consoleIcon} alt={game.ConsoleName} width={12} height={12} className="w-3 h-3 object-contain shrink-0" />
              )}
              {game.ConsoleName}
            </span>
            {extra?.awards.map((award, i) => {
              const date = new Date(award.AwardedAt).toLocaleDateString()
              if (award.AwardType === 'Mastery/Completion') {
                const isHC = award.AwardDataExtra === 1
                return (
                  <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isHC ? 'bg-warning/10 text-warning/90' : 'bg-success/10 text-success/90'
                  }`}>
                    {isHC ? '★ Mastered' : '✓ Completed'} · {date}
                  </span>
                )
              }
              if (award.AwardType === 'Game Beaten') {
                const isHC = award.AwardDataExtra === 1
                return (
                  <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isHC ? 'bg-warning/10 text-warning/80' : 'bg-info/10 text-info/90'
                  }`}>
                    ⚔ Beaten{isHC ? ' HC' : ''} · {date}
                  </span>
                )
              }
              return null
            })}
          </div>
          <p className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>
            {earned !== null ? `${earned} / ${total}` : total} {T.statusGameItem.achievements}
          </p>
          {pct !== null && (
            <div className="flex items-center gap-2 mt-1">
              <DualProgressBar
                softcorePct={isHardcore ? 0 : Math.min(pct, 100)}
                hardcorePct={isHardcore ? Math.min(pct, 100) : 0}
                trackClass="bg-bg-main"
                className="w-40"
              />
              <span className="text-xs text-text-secondary/60 tabular-nums">{Math.round(pct)}%</span>
            </div>
          )}
          {'AchievementsPublished' in game
            ? game.PointsTotal > 0 && (
              <p className="text-xs text-text-secondary/60 mt-1">
                {game.PointsTotal} {T.statusGameItem.pointsTotal}
              </p>
            )
            : (
              <p className="text-xs text-text-secondary/60 mt-1">
                {extra?.possibleScore != null
                  ? `${extra.scoreAchievedHardcore || extra.scoreAchieved || 0} / ${extra.possibleScore} ${T.statusGameItem.pointsEarned}`
                  : '—'}
              </p>
            )}
          {(extra || category === 'playing') && (
            <p className="text-xs text-text-secondary/60 mt-1">
              Last played · {extra?.lastPlayed ? new Date(extra.lastPlayed).toLocaleDateString() : 'a long time ago'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 self-center">
          <PinToggleButton
            gameId={typeof gameId === 'string' ? parseInt(gameId) : gameId}
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className="text-text-secondary/50 text-xs transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </div>
      </div>

      {open && (
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
              <AchievementGrid
                achievements={achievements}
                total={total}
                numDistinctPlayers={gameData?.NumDistinctPlayers ?? 1}
                gameId={gameId}
                gameTitle={game.Title}
                badgeSize={48}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
