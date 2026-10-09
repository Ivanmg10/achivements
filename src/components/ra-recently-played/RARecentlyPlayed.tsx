'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
import PsnGameItem from '@/components/psn/psn-game-item/PsnGameItem'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { mergeRecentFeeds, RecentFeedItem } from '@/utils/steamFeed'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

const MAX_GAMES = 6

// The list and an open card are two views. One leaves before the other comes
// in, so a card never grows over the others while they are still fading out.
const VIEW_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}
const VIEW_EASE = [0.4, 0, 0.2, 1] as const
// Rows share the column's height; an open card takes all of it.
const ROW_STYLE = { flex: '1 1 0%' }

// ─── Main component ───────────────────────────────────────────────────────────
export default function RARecentlyPlayed() {
  const { T } = useLanguage()
  const subject = useSubject()
  const reduce = useReducedMotion()
  const { games, isLoading, error, refetch } = useRecentlyPlayedGames()
  const { recent: steamRecent } = useSteamGamesData()
  const { library: psnLibrary } = usePsnGamesData()
  // One feed across platforms, newest first. Steam and PSN entries merge in
  // when they arrive rather than holding the RA feed back while they load.
  const feed = mergeRecentFeeds(games, steamRecent, MAX_GAMES, psnLibrary)

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

    // Steam and PSN cards load their own achievements when opened.
    if (item.source !== 'ra') return

    const gameId = item.game.GameID
    if (!gameDataMap.has(gameId)) {
      setLoadingId(gameId)
      try {
        const res = await fetch(withSubject(`/api/getGameProgression?gameId=${gameId}`, subject))
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
        {/* Pinned games are the viewer's own, so another user's page has no such view. */}
        {!subject && <MainViewToggle />}
      </div>

      {/* Cards */}
      <div className="flex flex-col flex-1 min-h-0">
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={expanded ?? 'list'}
              {...VIEW_MOTION}
              transition={{ duration: reduce ? 0 : 0.18, ease: VIEW_EASE }}
              className="home-fit-scroll flex flex-col gap-1.5 flex-1 min-h-0"
            >
            {displayedItems.map((item) => {
              const isExp = expanded === item.key

              if (item.source === 'psn') {
                return (
                  <div key={item.key} style={ROW_STYLE} className="flex flex-col min-h-0">
                    <PsnGameItem game={item.game} expanded={isExp} onToggle={() => handleExpand(item)} className="flex-1" />
                  </div>
                )
              }

              if (item.source === 'steam') {
                return (
                  <div key={item.key} style={ROW_STYLE} className="flex flex-col min-h-0">
                    <SteamGameItem
                      game={item.game}
                      expanded={isExp}
                      onToggle={() => handleExpand(item)}
                      className="flex-1"
                    />
                  </div>
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
                <div key={item.key} style={ROW_STYLE} className="flex flex-col min-h-0">
                  <RaGameItem game={g} expanded={isExp} onToggle={() => handleExpand(item)} className="flex-1">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : 0.1 }}>
                      <RARecentlyPlayedExpanded
                        game={g}
                        achievements={achievements}
                        numDistinctPlayers={data?.NumDistinctPlayers ?? 1}
                        isLoading={loadingId === g.GameID}
                      />
                    </motion.div>
                  </RaGameItem>
                </div>
              )
            })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
