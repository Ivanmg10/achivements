'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { RecentlyPlayedGame, RetroAchievementsGameWithAchievements, RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import { formatDate } from '@/utils/utils'
import { DualProgressBar } from '@/components/ui/DualProgressBar'
import { IconChevronLeft } from '@tabler/icons-react'

const MAX_GAMES = 7
const CONSOLE_BY_NAME = new Map(CONSOLES.map((c) => [c.name, c.icon]))

function pct(achieved: number, total: number) {
  if (!total) return 0
  return (achieved / total) * 100
}

function AchievementGrid({
  achievements,
  total,
}: {
  achievements: RetroAchievement[]
  total: number
}) {
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
    <div className="flex flex-wrap gap-1">
      {achievements.map((a) => {
        const isHardcore = !!a.DateEarnedHardcore
        const isSoftcore = !!a.DateEarned && !a.DateEarnedHardcore
        return (
          <div
            key={a.ID}
            className={`rounded-lg overflow-hidden shrink-0 relative ${
              isHardcore ? 'ring-2 ring-yellow-400' : isSoftcore ? 'ring-2 ring-blue-400' : 'opacity-30'
            }`}
            title={`${a.Title}${isHardcore ? ' (HC)' : isSoftcore ? ' (SC)' : ''}`}
          >
            {a.BadgeName ? (
              <Image
                src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                alt={a.Title}
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 bg-white/10" />
            )}
          </div>
        )
      })}
    </div>
  )
}

interface PublicRecentlyPlayedProps {
  raUsername: string
  games: RecentlyPlayedGame[]
  isLoading: boolean
}

export default function PublicRecentlyPlayed({
  raUsername,
  games,
  isLoading,
}: PublicRecentlyPlayedProps) {
  const { T } = useLanguage()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [gameDataMap, setGameDataMap] = useState<Map<number, RetroAchievementsGameWithAchievements>>(new Map())
  const [loadingId, setLoadingId] = useState<number | null>(null)

  async function handleExpand(gameId: number) {
    if (expanded === gameId) {
      setExpanded(null)
      return
    }
    setExpanded(gameId)
    if (!gameDataMap.has(gameId)) {
      setLoadingId(gameId)
      try {
        const res = await fetch(`/api/public/user/gameProgression?u=${encodeURIComponent(raUsername)}&gameId=${gameId}`)
        if (res.ok) {
          const data: RetroAchievementsGameWithAchievements = await res.json()
          setGameDataMap((prev) => new Map(prev).set(gameId, data))
        }
      } finally {
        setLoadingId(null)
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <AnimatePresence>
          {expanded !== null && (
            <motion.button
              key="back"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onClick={() => setExpanded(null)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-text-secondary hover:text-text-main focus-visible:outline-none"
            >
              <IconChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <p className="text-2xl font-bold flex-1">{T.cards.recentlyPlayed}</p>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-h-0">
        {isLoading ? (
          Array.from({ length: MAX_GAMES }).map((_, i) => (
            <div key={i} className="flex-1 bg-bg-main rounded-xl animate-pulse" style={{ minHeight: 72 }} />
          ))
        ) : games.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">{T.cards.noGames}</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {games.filter((g) => expanded === null || g.GameID === expanded).map((g) => {
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
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleExpand(g.GameID)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExpand(g.GameID)}
                    className="flex items-center gap-3 px-3 py-3 w-full text-left hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none shrink-0"
                  >
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
                          unoptimized
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
                      )}
                    </Link>

                    <div className="flex flex-col min-w-0 flex-1 gap-1">
                      <Link
                        href={`/gameInfo/${g.GameID}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-fit max-w-full focus-visible:outline-none hover:underline underline-offset-2 decoration-white/40"
                      >
                        <span className="text-base font-bold block truncate leading-tight">{g.Title}</span>
                      </Link>

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
                          <span className="text-xs text-text-secondary whitespace-nowrap">{g.ConsoleName}</span>
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

                      <div className="flex items-center gap-2 text-xs text-text-secondary/50">
                        {g.NumPossibleAchievements > 0 && (
                          <>
                            <span>{earnedAch}/{g.NumPossibleAchievements} logros</span>
                            <span className="opacity-40">·</span>
                            <span>{earnedPts}/{g.PossibleScore} pts</span>
                            <span className="opacity-40">·</span>
                          </>
                        )}
                        <span>{formatDate(g.LastPlayed)}</span>
                      </div>
                    </div>
                  </div>

                  {isExp && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.18 }}
                      className="flex-1 overflow-y-auto px-3 pb-3 pt-1 min-h-0"
                    >
                      <AchievementGrid
                        achievements={loadingId === g.GameID ? [] : achievements}
                        total={g.NumPossibleAchievements}
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
