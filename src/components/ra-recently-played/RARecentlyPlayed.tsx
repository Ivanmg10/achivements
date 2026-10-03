'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsGameWithAchievements, RetroAchievement } from '@/types/types'
import { IconChevronLeft, IconDeviceGamepad2 } from '@tabler/icons-react'
import { notify } from '@/lib/notify'
import RaGameItem from '@/components/ra-game-item/RaGameItem'
import { MainViewToggle } from '@/components/main-view-toggle/MainViewToggle'
import { RARecentlyPlayedExpanded } from '@/components/ra-recently-played/ra-recently-played-expanded/RARecentlyPlayedExpanded'
import EmptyState from '@/components/empty-state/EmptyState'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import { SectionFallback } from '@/components/ui/SectionFallback'
import SteamGameItem from '@/components/steam/steam-game-item/SteamGameItem'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { mergeRecentFeeds, RecentFeedItem } from '@/utils/steamFeed'

const MAX_GAMES = 7

const CARD_MOTION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, scaleY: 0.85, transition: { duration: 0.2 } },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  style: { originY: 0, flex: '1 1 0%' },
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RARecentlyPlayed() {
  const { T } = useLanguage()
  const { games, isLoading, error, refetch } = useRecentlyPlayedGames()
  const { recent: steamRecent } = useSteamGamesData()
  // One feed across platforms, newest first. Steam entries merge in when they
  // arrive rather than holding the RA feed back while Steam loads.
  const feed = mergeRecentFeeds(games, steamRecent, MAX_GAMES)

  // Keyed by feed key, not game id: RA game 730 and Steam app 730 are different games.
  const [expanded, setExpanded] = useState<string | null>(null)
  const [gameDataMap, setGameDataMap] = useState<
    Map<number, RetroAchievementsGameWithAchievements>
  >(new Map())
  const [loadingId, setLoadingId] = useState<number | null>(null)

  async function handleExpand(item: RecentFeedItem) {
    if (expanded === item.key) {
      setExpanded(null)
      return
    }

    setExpanded(item.key)

    // Steam cards load their own achievements when opened.
    if (item.source === 'steam') return

    const gameId = item.game.GameID
    if (!gameDataMap.has(gameId)) {
      setLoadingId(gameId)
      try {
        const res = await fetch(`/api/getGameProgression?gameId=${gameId}`)
        if (!res.ok) throw new Error(`getGameProgression ${res.status}`)
        const data: RetroAchievementsGameWithAchievements = await res.json()
        setGameDataMap((prev) => new Map(prev).set(gameId, data))
      } catch (err) {
        console.error('[RARecentlyPlayed]', err)
        notify.error(T.toast.loadAchievementsFailed)
      } finally {
        setLoadingId(null)
      }
    }
  }

  const displayedItems = expanded === null ? feed : feed.filter((item) => item.key === expanded)

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
              onClick={() => setExpanded(null)}
              className="p-1 rounded-lg hover:bg-ink/10 transition-colors text-text-secondary hover:text-text-main focus-visible:outline-none"
            >
              <IconChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <p className="text-2xl font-bold flex-1">{T.cards.recentlyPlayed}</p>
        <MainViewToggle />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0">
        {isLoading ? (
          <div className="flex flex-col gap-1.5 animate-pulse motion-reduce:animate-none">
            {Array.from({ length: MAX_GAMES }).map((_, i) => (
              <GameRowSkeleton key={i} />
            ))}
          </div>
        ) : error && feed.length === 0 ? (
          <SectionFallback error onRefresh={refetch}>{null}</SectionFallback>
        ) : feed.length === 0 ? (
          <EmptyState
            icon={<IconDeviceGamepad2 className="w-6 h-6" />}
            title={T.cards.noGames}
            subtitle={T.mainPage.noGamesInProgressSub}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {displayedItems.map((item) => {
              const isExp = expanded === item.key

              if (item.source === 'steam') {
                return (
                  <motion.div
                    key={item.key}
                    layout
                    {...CARD_MOTION}
                    className="flex flex-col min-h-0"
                  >
                    <SteamGameItem
                      game={item.game}
                      expanded={isExp}
                      onToggle={() => handleExpand(item)}
                      className="flex-1"
                    />
                  </motion.div>
                )
              }

              const g = item.game
              const data = gameDataMap.get(g.GameID)
              const achievements = data
                ? Object.values(data.Achievements ?? {})
                    .filter((a): a is RetroAchievement => !!a)
                    .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
                : []

              return (
                <motion.div key={item.key} layout {...CARD_MOTION} className="flex flex-col min-h-0">
                  <RaGameItem game={g} expanded={isExp} onToggle={() => handleExpand(item)} className="flex-1">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.18 }}>
                      <RARecentlyPlayedExpanded
                        game={g}
                        achievements={achievements}
                        numDistinctPlayers={data?.NumDistinctPlayers ?? 1}
                        isLoading={loadingId === g.GameID}
                      />
                    </motion.div>
                  </RaGameItem>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
