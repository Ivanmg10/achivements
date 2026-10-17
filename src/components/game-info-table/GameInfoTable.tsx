'use client'

import { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import GameInfoAchivement from '../game-info-achivement/GameInfoAchivement'
import GameInfoAchievementCard from '../game-info-achivement/GameInfoAchievementCard'
import AchievementModal from '../achievement-modal/AchievementModal'
import AchievementWarningPanel from '../achievement-warning-panel/AchievementWarningPanel'
import GameInfoTableFoldBar from '../game-info-table-fold-bar/GameInfoTableFoldBar'
import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { useRaFavoriteIds } from '@/hooks/useRaFavoriteIds'
import { SortableHeader, SortState, SortKey, DEFAULT_DIRS } from './SortableHeader'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'

type Filter = 'all' | 'earned' | 'unearned'
type SortDir = 'asc' | 'desc'

const COLLAPSED_ROWS = 3

export default function GameInfoTable({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SortState>({ key: 'default', dir: 'asc' })
  const [selectedAchievement, setSelectedAchievement] = useState<RetroAchievement | null>(null)
  const [tableExpanded, setTableExpanded] = useState(true)
  const { T } = useLanguage()

  const FILTER_LABELS: Record<Filter, string> = {
    all: T.gameInfoTable.filterAll,
    earned: T.gameInfoTable.filterEarned,
    unearned: T.gameInfoTable.filterUnearned,
  }

  const numDistinctPlayers = gameData?.NumDistinctPlayers ?? 1

  const { favoritedIds, leadingIds, toggleFavorite } = useRaFavoriteIds(gameData?.ID)
  const handleToggleFavorite = useCallback(
    (achievement: RetroAchievement) =>
      toggleFavorite(achievement, { gameTitle: gameData?.Title, numDistinctPlayers }),
    [toggleFavorite, gameData?.Title, numDistinctPlayers]
  )

  const achievements = useMemo(() => {
    if (!gameData) return []
    return Object.values(gameData.Achievements ?? {}).filter(
      (a): a is RetroAchievement => a !== undefined
    )
  }, [gameData])

  const missableUnearned = useMemo(
    () =>
      achievements
        .filter((a) => a.Type === 'missable' && !a.DateEarned)
        .sort((a, b) => a.DisplayOrder - b.DisplayOrder),
    [achievements]
  )

  const filtered = useMemo(() => {
    let list: RetroAchievement[]
    if (filter === 'earned') list = achievements.filter((a) => !!a.DateEarned)
    else if (filter === 'unearned') list = achievements.filter((a) => !a.DateEarned)
    else list = achievements

    const { key, dir } = sortState

    const sortFn = (a: RetroAchievement, b: RetroAchievement): number => {
      if (key === 'points') return b.Points - a.Points
      if (key === 'rarity')
        return a.NumAwarded / numDistinctPlayers - b.NumAwarded / numDistinctPlayers
      if (key === 'players') return b.NumAwarded - a.NumAwarded
      if (key === 'hc') return b.NumAwardedHardcore - a.NumAwardedHardcore
      if (key === 'earned') {
        if (!a.DateEarned && !b.DateEarned) return 0
        if (!a.DateEarned) return 1
        if (!b.DateEarned) return -1
        return new Date(b.DateEarned).getTime() - new Date(a.DateEarned).getTime()
      }
      return a.DisplayOrder - b.DisplayOrder
    }

    const sortGroup = (group: RetroAchievement[]) => {
      const sorted = [...group].sort(sortFn)
      return dir === 'desc' ? sorted.reverse() : sorted
    }

    // By the pins as they loaded: a row pinned now stays put instead of dragging the page up with it.
    const favGroup = list.filter((a) => leadingIds.has(a.ID))
    const restGroup = list.filter((a) => !leadingIds.has(a.ID))

    return [...sortGroup(favGroup), ...sortGroup(restGroup)]
  }, [achievements, filter, sortState, numDistinctPlayers, leadingIds])

  function handleSort(key: SortKey) {
    setSortState((prev) =>
      prev.key === key
        ? { key, dir: (prev.dir === 'asc' ? 'desc' : 'asc') as SortDir }
        : { key, dir: DEFAULT_DIRS[key] }
    )
  }

  const needsToggle = filtered.length > COLLAPSED_ROWS
  // Folded, only the first rows exist: hidden ones are not rendered (nor
  // reachable with Tab), as in the Steam table.
  const shown = tableExpanded || !needsToggle ? filtered : filtered.slice(0, COLLAPSED_ROWS)

  return (
    <section className="bg-bg-card p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5 mb-5">
      <AchievementWarningPanel
        label={T.gameInfoTable.missableWarning}
        items={missableUnearned.map((a) => ({
          key: String(a.ID),
          title: a.Title,
          description: a.Description,
          iconUrl: a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}.png` : null,
          onSelect: () => setSelectedAchievement(a),
        }))}
      />

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap" role="group" aria-label={T.gameInfoPage.achievements}>
        {(['all', 'earned', 'unearned'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              filter === f
                ? 'bg-bg-header text-text-main ring-1 ring-text-secondary/30'
                : 'bg-bg-card/60 text-text-secondary hover:text-text-main hover:bg-bg-card'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Top collapse toggle */}
      {gameData && needsToggle && (
        <GameInfoTableFoldBar
          expanded={tableExpanded}
          onToggle={() => setTableExpanded((e) => !e)}
          shown={filtered.length}
          total={achievements.length}
        />
      )}

      {gameData && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block w-full">
            <div className="relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-sm border-b border-bg-header">
                    <th className="px-3 py-2 w-24 text-center text-text-secondary">
                      {T.gameInfoTable.headerIcon}
                    </th>
                    <SortableHeader sortKey="default" sortState={sortState} onSort={handleSort} className="text-left">
                      {T.gameInfoTable.headerAchievement}
                    </SortableHeader>
                    <SortableHeader sortKey="players" sortState={sortState} onSort={handleSort} className="w-40 text-center">
                      {T.gameInfoTable.headerPlayers}
                    </SortableHeader>
                    <SortableHeader sortKey="hc" sortState={sortState} onSort={handleSort} className="w-36 text-center">
                      {T.gameInfoTable.headerHC}
                    </SortableHeader>
                    <SortableHeader sortKey="rarity" sortState={sortState} onSort={handleSort} className="w-32 text-center">
                      {T.gameInfoTable.headerRarity}
                    </SortableHeader>
                    <SortableHeader sortKey="earned" sortState={sortState} onSort={handleSort} className="w-36 text-center">
                      {T.gameInfoTable.headerEarned}
                    </SortableHeader>
                    <SortableHeader sortKey="points" sortState={sortState} onSort={handleSort} className="w-24 text-center">
                      {T.gameInfoTable.headerPoints}
                    </SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((achievement) => (
                    <GameInfoAchivement
                      achievement={achievement}
                      numDistinctPlayers={numDistinctPlayers}
                      key={achievement.ID}
                      isFavorited={favoritedIds.has(achievement.ID)}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={() => setSelectedAchievement(achievement)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden w-full">
            <div className="relative flex flex-col gap-2">
              {shown.map((achievement) => (
                <GameInfoAchievementCard
                  key={achievement.ID}
                  achievement={achievement}
                  numDistinctPlayers={numDistinctPlayers}
                  isFavorited={favoritedIds.has(achievement.ID)}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              ))}
            </div>
          </div>

          {/* Expand / collapse toggle */}
          {needsToggle && (
            <button
              onClick={() => setTableExpanded((e) => !e)}
              aria-expanded={tableExpanded}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-bg-header hover:bg-bg-header/80 text-text-secondary hover:text-text-main transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {tableExpanded ? (
                <>
                  <IconChevronUp className="w-4 h-4" aria-hidden="true" />
                  {T.gameInfoTable.collapseTable}
                </>
              ) : (
                <>
                  <IconChevronDown className="w-4 h-4" aria-hidden="true" />
                  {T.gameInfoTable.expandTable} ({filtered.length})
                </>
              )}
            </button>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementModal
            achievement={selectedAchievement}
            numDistinctPlayers={numDistinctPlayers}
            onClose={() => setSelectedAchievement(null)}
            gameId={gameData?.ID}
            isFavorited={favoritedIds.has(selectedAchievement.ID)}
            onToggleFavorite={() => handleToggleFavorite(selectedAchievement)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
