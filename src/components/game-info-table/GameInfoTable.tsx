'use client'

import { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import GameInfoAchivement from '../game-info-achivement/GameInfoAchivement'
import GameInfoAchievementCard from '../game-info-achivement/GameInfoAchievementCard'
import AchievementModal from '../achievement-modal/AchievementModal'
import MissableNotice from '../missable-notice/MissableNotice'
import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRaFavoriteIds } from '@/hooks/useRaFavoriteIds'
import { SortableHeader, SortState, SortKey, DEFAULT_DIRS } from './SortableHeader'
import { tabClass, TAB_ROW } from '@/components/ui/Tabs'
import { SURFACE } from '@/components/ui/surface'
import { buttonClass } from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import { TABLE, TH } from '@/components/ui/dataTable'

type Filter = 'all' | 'earned' | 'unearned' | 'missable'
type SortDir = 'asc' | 'desc'

/** Rows shown before "show the other N". */
const FIRST_ROWS = 8

/**
 * An RA game's achievements, as agreed on the canvas: the missables in one
 * line on top, the filters as tabs with their counts beside a search and the
 * order, then the table (cards on a phone), its first rows and a button for
 * the rest.
 */
export default function GameInfoTable({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [sortState, setSortState] = useState<SortState>({ key: 'default', dir: 'asc' })
  const [selectedAchievement, setSelectedAchievement] = useState<RetroAchievement | null>(null)
  const [showAll, setShowAll] = useState(false)
  const { T } = useLanguage()

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
  const earnedCount = achievements.filter((a) => !!a.DateEarned).length

  const filtered = useMemo(() => {
    let list: RetroAchievement[]
    if (filter === 'earned') list = achievements.filter((a) => !!a.DateEarned)
    else if (filter === 'unearned') list = achievements.filter((a) => !a.DateEarned)
    else if (filter === 'missable') list = missableUnearned
    else list = achievements
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((a) => a.Title.toLowerCase().includes(q) || a.Description.toLowerCase().includes(q))

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
  }, [achievements, missableUnearned, filter, query, sortState, numDistinctPlayers, leadingIds])

  function handleSort(key: SortKey) {
    setSortState((prev) =>
      prev.key === key
        ? { key, dir: (prev.dir === 'asc' ? 'desc' : 'asc') as SortDir }
        : { key, dir: DEFAULT_DIRS[key] }
    )
  }

  // A search shows every match; otherwise the first rows, then a button for the rest.
  const folded = !showAll && !query.trim() && filtered.length > FIRST_ROWS
  const shown = folded ? filtered.slice(0, FIRST_ROWS) : filtered

  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: T.gameInfoTable.filterAll, count: achievements.length },
    { value: 'earned', label: T.gameInfoTable.filterEarned, count: earnedCount },
    { value: 'unearned', label: T.gameInfoTable.filterUnearned, count: achievements.length - earnedCount },
  ]
  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'default', label: T.gameInfoTable.sortGameOrder },
    { value: 'points', label: T.gameInfoTable.headerPoints },
    { value: 'rarity', label: T.gameInfoTable.headerRarity },
    { value: 'players', label: T.gameInfoTable.headerPlayers },
    { value: 'earned', label: T.gameInfoTable.headerEarned },
  ]

  return (
    <div className="w-full px-4 sm:px-8 lg:px-14 mt-7 mb-7">
    <section aria-label={T.gameInfoPage.achievements} className={`${SURFACE} p-4 sm:p-6 flex flex-col gap-4`}>
      <MissableNotice
        names={missableUnearned.map((a) => a.Title)}
        only={filter === 'missable'}
        onToggleOnly={() => setFilter((f) => (f === 'missable' ? 'all' : 'missable'))}
      />

      <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
        <div className={`${TAB_ROW} flex-1`} role="group" aria-label={T.gameInfoPage.achievements}>
          {tabs.map((t) => (
            <button key={t.value} type="button" onClick={() => setFilter(t.value)} aria-pressed={filter === t.value} className={tabClass(filter === t.value)}>
              {t.label}
              <span className="text-xs font-bold tabular-nums text-text-secondary">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5 lg:pb-1.5">
          <SearchInput
            aria-label={T.gameInfoTable.searchPlaceholder}
            placeholder={T.gameInfoTable.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 lg:w-[16.25rem] lg:flex-none"
          />
          <Select<SortKey>
            look="button"
            size="sm"
            aria-label={T.gameInfoTable.sortLabel}
            value={sortState.key}
            onChange={(key) => setSortState({ key, dir: DEFAULT_DIRS[key] })}
            options={sortOptions}
          />
        </div>
      </div>

      {gameData && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block w-full">
            <table className={TABLE}>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} w-16`}>
                    <span className="sr-only">{T.gameInfoTable.headerIcon}</span>
                  </th>
                  <SortableHeader sortKey="default" sortState={sortState} onSort={handleSort}>
                    {T.gameInfoTable.headerAchievement}
                  </SortableHeader>
                  <SortableHeader sortKey="players" sortState={sortState} onSort={handleSort} align="right" className="w-32">
                    {T.gameInfoTable.headerPlayers}
                  </SortableHeader>
                  <SortableHeader sortKey="hc" sortState={sortState} onSort={handleSort} align="right" className="w-32">
                    {T.gameInfoTable.headerHC}
                  </SortableHeader>
                  <SortableHeader sortKey="rarity" sortState={sortState} onSort={handleSort} align="center" className="w-28">
                    {T.gameInfoTable.headerRarity}
                  </SortableHeader>
                  <SortableHeader sortKey="earned" sortState={sortState} onSort={handleSort} align="right" className="w-28">
                    {T.gameInfoTable.headerEarned}
                  </SortableHeader>
                  <SortableHeader sortKey="points" sortState={sortState} onSort={handleSort} align="right" className="w-24">
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

          {/* Mobile card list */}
          <div className="sm:hidden w-full flex flex-col gap-2">
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

          {filtered.length === 0 && <p className="text-sm text-text-secondary text-center py-6">{T.gameInfoTable.noMatches}</p>}

          {(folded || (showAll && filtered.length > FIRST_ROWS && !query.trim())) && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={!folded}
              className={buttonClass('secondary', 'md', 'self-center')}
            >
              {folded ? T.gameInfoTable.showRest.replace('{n}', String(filtered.length - FIRST_ROWS)) : T.gameInfoTable.showLess}
              {folded ? <IconChevronDown className="w-4 h-4" aria-hidden="true" /> : <IconChevronUp className="w-4 h-4" aria-hidden="true" />}
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
            gameTitle={gameData?.Title}
            isFavorited={favoritedIds.has(selectedAchievement.ID)}
            onToggleFavorite={() => handleToggleFavorite(selectedAchievement)}
          />
        )}
      </AnimatePresence>
    </section>
    </div>
  )
}
