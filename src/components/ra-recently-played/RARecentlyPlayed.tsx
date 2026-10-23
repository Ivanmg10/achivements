'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsGameWithAchievements, RetroAchievement } from '@/types/types'
import { IconDeviceGamepad2 } from '@tabler/icons-react'
import { notify } from '@/lib/notify'
import RaGameItem from '@/components/ra-game-item/RaGameItem'
import { MainViewToggle } from '@/components/main-view-toggle/MainViewToggle'
import ViewEntrance from '@/components/view-entrance/ViewEntrance'
import { RARecentlyPlayedExpanded } from '@/components/ra-recently-played/ra-recently-played-expanded/RARecentlyPlayedExpanded'
import EmptyState from '@/components/empty-state/EmptyState'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import { SectionFallback } from '@/components/ui/SectionFallback'
import SteamGameItem from '@/components/steam/steam-game-item/SteamGameItem'
import PsnGameItem from '@/components/psn/psn-game-item/PsnGameItem'
import PsnCollectionItem from '@/components/psn/psn-collection-item/PsnCollectionItem'
import XboxGameItem from '@/components/xbox/xbox-game-item/XboxGameItem'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
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
  const { recent: steamRecent, recentLoading: steamLoading } = useSteamGamesData()
  const { library: psnLibrary, libraryLoading: psnLoading } = usePsnGamesData()
  const { library: xboxLibrary, libraryLoading: xboxLoading } = useXboxGamesData()
  // One feed across platforms, newest first. It shows once every linked
  // platform has answered, so games never pop in (and reorder) a moment later.
  const loading = isLoading || steamLoading || psnLoading || xboxLoading
  const feed = mergeRecentFeeds(games, steamRecent, MAX_GAMES, psnLibrary, xboxLibrary)

  // Keyed by feed key, not game id: RA game 730 and Steam app 730 are different games.
  const [expanded, setExpanded] = useState<string | null>(null)
  const [gameDataMap, setGameDataMap] = useState<
    Map<number, RetroAchievementsGameWithAchievements>
  >(new Map())
  const [loadingId, setLoadingId] = useState<number | null>(null)
  // The rows' entrance plays once; rows that mount later (a platform answering late, back from an open card) just appear.
  const [entered, setEntered] = useState(false)

  async function handleExpand(item: RecentFeedItem) {
    if (expanded === item.key) {
      setExpanded(null)
      return
    }

    setExpanded(item.key)

    // Steam, PSN and Xbox cards load their own achievements when opened.
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
        {/* Pinned games are the viewer's own, so another user's page has no such view. */}
        {subject ? <p className="text-2xl font-bold flex-1">{T.cards.recentlyPlayed}</p> : <MainViewToggle />}
      </div>

      {/* Cards */}
      <div className="flex flex-col flex-1 min-h-0">
        {loading ? (
          // Sized like the loaded list (home-fit-scroll, rows sharing the height), so the rows fill the card and nothing jumps when it loads.
          <div className="home-fit-scroll flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden animate-pulse motion-reduce:animate-none">
            {Array.from({ length: MAX_GAMES }).map((_, i) => (
              <GameRowSkeleton key={i} className="flex-1" />
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
          // No initial={false}: it would reach the rows too and block their entrance.
          <AnimatePresence mode="wait">
            <motion.div
              key={expanded ?? 'list'}
              {...VIEW_MOTION}
              // The first time the list appears its rows make the entrance; the box only fades between views after that.
              initial={entered ? VIEW_MOTION.initial : false}
              transition={{ duration: reduce ? 0 : 0.18, ease: VIEW_EASE }}
              className="home-fit-scroll flex flex-col gap-1.5 flex-1 min-h-0"
            >
            {displayedItems.map((item, i) => {
              const isExp = expanded === item.key

              if (item.source === 'psn') {
                return (
                  <ViewEntrance key={item.key} kind="feed" index={i} play={!entered} onStart={i === 0 ? () => setEntered(true) : undefined} style={ROW_STYLE} className="flex flex-col min-h-0">
                    <PsnGameItem game={item.game} expanded={isExp} onToggle={() => handleExpand(item)} className="flex-1" />
                  </ViewEntrance>
                )
              }

              if (item.source === 'psnCollection') {
                return (
                  <ViewEntrance key={item.key} kind="feed" index={i} play={!entered} onStart={i === 0 ? () => setEntered(true) : undefined} style={ROW_STYLE} className="flex flex-col min-h-0">
                    <PsnCollectionItem collection={item.collection} games={item.games} expanded={isExp} onToggle={() => handleExpand(item)} className="flex-1" />
                  </ViewEntrance>
                )
              }

              if (item.source === 'xbox') {
                return (
                  <ViewEntrance key={item.key} kind="feed" index={i} play={!entered} onStart={i === 0 ? () => setEntered(true) : undefined} style={ROW_STYLE} className="flex flex-col min-h-0">
                    <XboxGameItem game={item.game} expanded={isExp} onToggle={() => handleExpand(item)} className="flex-1" />
                  </ViewEntrance>
                )
              }

              if (item.source === 'steam') {
                return (
                  <ViewEntrance key={item.key} kind="feed" index={i} play={!entered} onStart={i === 0 ? () => setEntered(true) : undefined} style={ROW_STYLE} className="flex flex-col min-h-0">
                    <SteamGameItem
                      game={item.game}
                      expanded={isExp}
                      onToggle={() => handleExpand(item)}
                      className="flex-1"
                    />
                  </ViewEntrance>
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
                <ViewEntrance key={item.key} kind="feed" index={i} play={!entered} onStart={i === 0 ? () => setEntered(true) : undefined} style={ROW_STYLE} className="flex flex-col min-h-0">
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
                </ViewEntrance>
              )
            })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
