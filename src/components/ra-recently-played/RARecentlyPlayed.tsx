'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsGameWithAchievements, RetroAchievement } from '@/types/types'
import { CONSOLES } from '@/constants'
import { relativeTime } from '@/utils/utils'
import { IconChevronLeft, IconLayoutList } from '@tabler/icons-react'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import { useMainView } from '@/context/MainViewContext'

const MAX_GAMES = 7
const GAP_PX = 6 // gap-1.5
const BADGE_PX = 44 // w-10 (40) + gap-1 (4)
const CARD_PADDING_X = 24 // px-3 * 2

const CONSOLE_BY_NAME = new Map(CONSOLES.map((c) => [c.name, c.icon]))

function pct(achieved: number, total: number) {
  if (!total) return 0
  return (achieved / total) * 100
}

// ─── Achievement grid ─────────────────────────────────────────────────────────
function AchievementGrid({
  achievements,
  total,
  gameId,
  gameTitle,
  numDistinctPlayers,
}: {
  achievements: RetroAchievement[]
  total: number
  gameId: number
  gameTitle: string
  numDistinctPlayers: number
}) {
  const [tooltip, setTooltip] = useState<{ a: RetroAchievement; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<RetroAchievement | null>(null)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    fetch(`/api/favorites?gameId=${gameId}`)
      .then((r) => r.json())
      .then((rows: { achievement_id: number }[]) =>
        setFavoritedIds(new Set(rows.map((r) => r.achievement_id)))
      )
      .catch(() => {})
  }, [gameId])

  const handleToggleFavorite = useCallback(
    async (achievement: RetroAchievement) => {
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
          body: JSON.stringify({ achievement, gameId, gameTitle, numDistinctPlayers }),
        })
      }
    },
    [favoritedIds, gameId, gameTitle, numDistinctPlayers]
  )

  function handleEnter(a: RetroAchievement, e: React.MouseEvent) {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setTooltip({ a, x: e.clientX, y: e.clientY }), 400)
  }
  function handleLeave() {
    clearTimeout(timerRef.current)
    setTooltip(null)
  }

  if (achievements.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(total, 30) }).map((_, i) => (
          <div key={i} className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-1 ">
        {achievements.map((a) => {
          const isHardcore = !!a.DateEarnedHardcore
          const isSoftcore = !!a.DateEarned && !a.DateEarnedHardcore
          const earned = isHardcore || isSoftcore
          return (
            <div
              key={a.ID}
              onMouseEnter={(e) => handleEnter(a, e)}
              onMouseLeave={handleLeave}
              onClick={() => {
                handleLeave()
                setSelected(a)
              }}
              className={`rounded-lg  overflow-hidden shrink-0 cursor-pointer transition-transform duration-100 hover:scale-110 relative ${
                isHardcore ? 'ring-2 ring-yellow-400' : isSoftcore ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              {a.BadgeName ? (
                <Image
                  src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                  alt={a.Title}
                  width={40}
                  height={40}
                  className={`w-10 h-10 object-cover ${earned ? '' : 'grayscale opacity-35'}`}
                  unoptimized
                />
              ) : (
                <div className={`w-10 h-10 rounded-lg bg-white/10 ${earned ? '' : 'opacity-35'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Portal so tooltip escapes Framer Motion transform stacking context */}
      {tooltip &&
        createPortal(
          <div
            className="fixed pointer-events-none bg-bg-card border border-white/10 rounded-xl shadow-2xl p-3 max-w-60"
            style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
          >
            <p className="text-sm font-semibold text-text-main">{tooltip.a.Title}</p>
            <p className="text-xs text-text-secondary mt-1 leading-snug">{tooltip.a.Description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-text-secondary/70">{tooltip.a.Points} pts</span>
              {tooltip.a.DateEarnedHardcore && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">
                  HC
                </span>
              )}
              {tooltip.a.DateEarned && !tooltip.a.DateEarnedHardcore && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300">
                  SC
                </span>
              )}
            </div>
          </div>,
          document.body
        )}

      <AnimatePresence>
        {selected && (
          <AchievementModal
            achievement={selected}
            numDistinctPlayers={numDistinctPlayers}
            onClose={() => setSelected(null)}
            gameId={gameId}
            isFavorited={favoritedIds.has(selected.ID)}
            onToggleFavorite={() => handleToggleFavorite(selected)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RARecentlyPlayed() {
  const { T } = useLanguage()
  const { setView } = useMainView()
  const games = useRecentlyPlayedGames()
  const recent = games.slice(0, MAX_GAMES)

  const [expanded, setExpanded] = useState<number | null>(null)
  const [extraVisible, setExtraVisible] = useState(MAX_GAMES - 1)
  const [gameDataMap, setGameDataMap] = useState<
    Map<number, RetroAchievementsGameWithAchievements>
  >(new Map())
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  async function handleExpand(gameId: number) {
    if (expanded === gameId) {
      setExpanded(null)
      setExtraVisible(MAX_GAMES - 1)
      return
    }

    if (cardsRef.current) {
      const containerH = cardsRef.current.offsetHeight
      const containerW = cardsRef.current.offsetWidth

      const firstCard = cardsRef.current.firstElementChild as HTMLElement | null
      const cardH = firstCard ? firstCard.offsetHeight : 80

      const game = recent.find((g) => g.GameID === gameId)!
      const badgesPerRow = Math.max(1, Math.floor((containerW - CARD_PADDING_X) / BADGE_PX))
      const rows = Math.ceil((game.NumPossibleAchievements || 12) / badgesPerRow)
      const achH = (rows + 1) * BADGE_PX + 16
      const expandedMinH = cardH + achH

      const leftover = containerH - expandedMinH
      const extra = Math.max(0, Math.floor((leftover + GAP_PX) / (cardH + GAP_PX)))
      setExtraVisible(extra)
    }

    setExpanded(gameId)

    if (!gameDataMap.has(gameId)) {
      setLoadingId(gameId)
      try {
        const res = await fetch(`/api/getGameProgression?gameId=${gameId}`)
        if (res.ok) {
          const data: RetroAchievementsGameWithAchievements = await res.json()
          setGameDataMap((prev) => new Map(prev).set(gameId, data))
        }
      } finally {
        setLoadingId(null)
      }
    }
  }

  const displayedGames =
    expanded === null
      ? recent
      : (() => {
          let otherCount = 0
          return recent.filter((g) => {
            if (g.GameID === expanded) return true
            if (otherCount < extraVisible) {
              otherCount++
              return true
            }
            return false
          })
        })()

  const isLoading = recent.length === 0

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <AnimatePresence>
          {expanded !== null && (
            <motion.button
              key="back"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setExpanded(null)
                setExtraVisible(MAX_GAMES - 1)
              }}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-text-secondary hover:text-text-main focus-visible:outline-none"
            >
              <IconChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <p className="text-2xl font-bold flex-1">{T.cards.recentlyPlayed}</p>
        <button
          onClick={() => setView('panels')}
          aria-label="Ver estoy jugando"
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconLayoutList className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {/* Cards */}
      <div ref={cardsRef} className="flex flex-col gap-1.5 flex-1 min-h-0">
        {isLoading ? (
          Array.from({ length: MAX_GAMES }).map((_, i) => (
            <div key={i} className="flex-1 bg-bg-main rounded-xl animate-pulse" />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {displayedGames.map((g) => {
              const isExp = expanded === g.GameID
              const consoleIcon = CONSOLE_BY_NAME.get(g.ConsoleName)
              const data = gameDataMap.get(g.GameID)
              const achievements = data
                ? Object.values(data.Achievements ?? {})
                    .filter((a): a is RetroAchievement => !!a)
                    .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
                : []

              const earnedAch = g.NumAchievedHardcore || g.NumAchieved
              const earnedPts = g.ScoreAchievedHardcore || g.ScoreAchieved

              return (
                <motion.div
                  key={g.GameID}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, scaleY: 0.85, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{ originY: 0, flex: expanded === null || isExp ? '1 1 0%' : '0 0 auto' }}
                  className="bg-bg-main rounded-xl overflow-hidden flex flex-col min-h-0"
                >
                  {/* Card row — div+onClick avoids nested <button><a> invalid HTML */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleExpand(g.GameID)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExpand(g.GameID)}
                    className="flex items-center gap-3 px-3 py-3 w-full text-left hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none shrink-0"
                  >
                    {/* Icon — link only on this element */}
                    <Link
                      href={`/gameInfo/${g.GameID}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 focus-visible:outline-none"
                    >
                      {g.ImageIcon ? (
                        <Image
                          src={`https://retroachievements.org${g.ImageIcon}`}
                          alt={g.Title}
                          width={56}
                          height={56}
                          className="rounded-xl object-cover w-14 h-14"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
                      )}
                    </Link>

                    <div className="flex flex-col min-w-0 flex-1 gap-1">
                      {/* Title — w-fit so link area = text area only */}
                      <Link
                        href={`/gameInfo/${g.GameID}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-fit max-w-full focus-visible:outline-none hover:underline underline-offset-2 decoration-white/40"
                      >
                        <span className="text-base font-bold block truncate leading-tight">
                          {g.Title}
                        </span>
                      </Link>

                      {/* Console + progress bar + chevron */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 shrink-0">
                          {consoleIcon && (
                            <Image
                              src={consoleIcon}
                              alt={g.ConsoleName}
                              width={12}
                              height={12}
                              className="w-3 h-3 object-contain opacity-60 shrink-0"
                            />
                          )}
                          <span className="text-xs text-text-secondary whitespace-nowrap">
                            {g.ConsoleName}
                          </span>
                        </div>
                        {g.NumPossibleAchievements > 0 && (
                          <DualProgressBar
                            softcorePct={pct(g.NumAchieved, g.NumPossibleAchievements)}
                            hardcorePct={pct(g.NumAchievedHardcore, g.NumPossibleAchievements)}
                            className="flex-1"
                          />
                        )}
                        <motion.span
                          animate={{ rotate: isExp ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-text-secondary/30 text-[10px] shrink-0"
                        >
                          ▼
                        </motion.span>
                      </div>

                      {/* Stats + last played */}
                      <div className="flex items-center gap-2 text-xs text-text-secondary/50">
                        {g.NumPossibleAchievements > 0 && (
                          <>
                            <span>
                              {earnedAch}/{g.NumPossibleAchievements} logros
                            </span>
                            <span className="opacity-40">·</span>
                            <span>
                              {earnedPts}/{g.PossibleScore} pts
                            </span>
                            <span className="opacity-40">·</span>
                          </>
                        )}
                        <span>{relativeTime(g.LastPlayed)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Achievement grid — only when expanded */}
                  {isExp && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.18 }}
                      className="flex-1 overflow-y-auto px-3 pb-3 pt-3 min-h-0"
                    >
                      <AchievementGrid
                        achievements={loadingId === g.GameID ? [] : achievements}
                        total={g.NumPossibleAchievements}
                        gameId={g.GameID}
                        gameTitle={g.Title}
                        numDistinctPlayers={data?.NumDistinctPlayers ?? 1}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
