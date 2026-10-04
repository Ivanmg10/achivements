'use client'

import { memo, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useRaFavoriteIds } from '@/hooks/useRaFavoriteIds'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import ShowAllButton from '@/components/show-all-button/ShowAllButton'
import { capList } from '@/utils/utils'

type TooltipData = { achievement: RetroAchievement; x: number; y: number }

const SIZE_CLASSES = {
  40: { badge: 'w-10 h-10', img: 40 },
  48: { badge: 'w-12 h-12', img: 48 },
} as const

// Memoized so tooltip/selection state changes don't re-render the parent card
export const AchievementGrid = memo(function AchievementGrid({
  achievements,
  total,
  gameId,
  gameTitle,
  numDistinctPlayers,
  badgeSize = 40,
  limit,
}: {
  achievements: RetroAchievement[]
  total: number
  gameId: number | string
  gameTitle: string
  numDistinctPlayers: number
  badgeSize?: 40 | 48
  /** Show only this many until asked for the rest (a card on a list page). */
  limit?: number
}) {
  const { T } = useLanguage()
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [selected, setSelected] = useState<RetroAchievement | null>(null)
  // The badge set whose images have loaded. Keyed by the badges, not the array:
  // a parent re-rendering hands over a new array of the same achievements, and
  // treating that as new sent the grid back to its skeleton, over and over.
  const badgeKey = achievements.map((a) => a.BadgeName).join(',')
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const allLoaded = achievements.length === 0 || loadedKey === badgeKey
  const [showAll, setShowAll] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const size = SIZE_CLASSES[badgeSize]
  const { visible: shown, capped } = capList(achievements, limit ?? Infinity, showAll)

  const { favoritedIds, toggleFavorite } = useRaFavoriteIds(gameId)
  const handleToggleFavorite = (achievement: RetroAchievement) =>
    toggleFavorite(achievement, { gameTitle, numDistinctPlayers })

  useEffect(() => {
    if (!badgeKey) return
    const names = badgeKey.split(',')
    let count = 0
    let cancelled = false
    const finish = () => {
      if (!cancelled) setLoadedKey(badgeKey)
    }
    const done = () => {
      count++
      if (count >= names.length) finish()
    }
    names.forEach((name) => {
      const img = new window.Image()
      img.onload = done
      img.onerror = done
      img.src = `https://media.retroachievements.org/Badge/${name}.png`
    })
    const timeout = setTimeout(finish, 1500)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [badgeKey])

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression: { label: T.achievement.progression, className: 'bg-info/20 text-info' },
    win_condition: { label: T.achievement.completed, className: 'bg-warning/20 text-warning' },
    missable: { label: T.achievement.missable, className: 'bg-danger/20 text-danger' },
  }

  function handleEnter(a: RetroAchievement, x: number, y: number) {
    hoverTimeout.current = setTimeout(() => setTooltip({ achievement: a, x, y }), 450)
  }

  function handleLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setTooltip(null)
  }

  if (achievements.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(total, 30) }).map((_, i) => (
          <div key={i} className={`${size.badge} rounded-lg bg-ink/10 animate-pulse`} />
        ))}
      </div>
    )
  }

  return (
    <>
      {!allLoaded && (
        <div className="flex flex-wrap gap-1">
          {shown.map((_, i) => (
            <div key={i} className={`${size.badge} rounded-lg bg-bg-main animate-pulse`} />
          ))}
        </div>
      )}
      <div className={allLoaded ? 'flex flex-wrap gap-1' : 'hidden'}>
        {shown.map((a) => {
          const isHardcore = !!a.DateEarnedHardcore
          const isSoftcore = !!a.DateEarned && !a.DateEarnedHardcore
          const earnedAny = isHardcore || isSoftcore

          return (
            <button
              type="button"
              key={a.ID}
              aria-label={`${a.Title}, ${earnedAny ? T.steam.earned : T.steam.locked}`}
              onMouseEnter={(e) => handleEnter(a, e.clientX, e.clientY)}
              onMouseLeave={handleLeave}
              onFocus={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                handleEnter(a, r.right, r.top)
              }}
              onBlur={handleLeave}
              onClick={() => {
                handleLeave()
                setSelected(a)
              }}
              className={`block rounded-lg overflow-hidden shrink-0 cursor-pointer transition-transform duration-100 hover:scale-110 focus-visible:scale-110 hover:z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isHardcore ? 'ring-2 ring-yellow-400' : isSoftcore ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              {a.BadgeName ? (
                <Image
                  src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                  alt=""
                  width={size.img}
                  height={size.img}
                  className={`${size.badge} object-cover ${earnedAny ? '' : 'grayscale opacity-40'}`}
                  unoptimized
                />
              ) : (
                <div className={`${size.badge} rounded-lg bg-ink/10 ${earnedAny ? '' : 'opacity-40'}`} />
              )}
            </button>
          )
        })}
      </div>
      {allLoaded && capped && (
        <ShowAllButton total={achievements.length} expanded={showAll} onToggle={() => setShowAll((s) => !s)} />
      )}

      {/* Portal so the tooltip escapes any ancestor Framer Motion transform stacking context */}
      {tooltip &&
        createPortal(
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
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_BADGES[tooltip.achievement.Type].className}`}
                >
                  {TYPE_BADGES[tooltip.achievement.Type].label}
                </span>
              )}
              {tooltip.achievement.DateEarnedHardcore && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-warning/20 text-warning">
                  Hardcore
                </span>
              )}
              {tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-info/20 text-info">
                  Softcore
                </span>
              )}
              {!tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
                <span className="text-xs text-text-secondary">{T.achievement.notEarned}</span>
              )}
            </div>
            {(tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned) && (
              <p className="text-xs text-text-secondary mt-1">
                {new Date(
                  (tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned)!,
                ).toLocaleDateString()}
              </p>
            )}
          </div>,
          document.body
        )}

      <AnimatePresence>
        {selected && (
          <AchievementModal
            achievement={selected}
            numDistinctPlayers={numDistinctPlayers}
            onClose={() => setSelected(null)}
            gameId={typeof gameId === 'string' ? parseInt(gameId) : gameId}
            isFavorited={favoritedIds.has(selected.ID)}
            onToggleFavorite={() => handleToggleFavorite(selected)}
          />
        )}
      </AnimatePresence>
    </>
  )
})
