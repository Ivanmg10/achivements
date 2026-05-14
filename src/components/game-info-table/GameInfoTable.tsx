'use client'

import { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import GameInfoAchivement from '../game-info-achivement/GameInfoAchivement'
import GameInfoAchievementCard from '../game-info-achivement/GameInfoAchievementCard'
import AchievementModal from '../achievement-modal/AchievementModal'
import Image from 'next/image'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { SortableHeader, SortState, SortKey, DEFAULT_DIRS } from './SortableHeader'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'

type Filter = 'all' | 'earned' | 'unearned'
type SortDir = 'asc' | 'desc'

const COLLAPSED_ROWS = 3
const COLLAPSED_HEIGHT = COLLAPSED_ROWS * 82

export default function GameInfoTable({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SortState>({ key: 'default', dir: 'asc' })
  const [missableOpen, setMissableOpen] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<RetroAchievement | null>(null)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())
  const [tableExpanded, setTableExpanded] = useState(true)
  const { T } = useLanguage()

  const FILTER_LABELS: Record<Filter, string> = {
    all: T.gameInfoTable.filterAll,
    earned: T.gameInfoTable.filterEarned,
    unearned: T.gameInfoTable.filterUnearned,
  }

  const numDistinctPlayers = gameData?.NumDistinctPlayers ?? 1

  useEffect(() => {
    if (!gameData?.ID) return
    fetch(`/api/favorites?gameId=${gameData.ID}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load favorites')
        return r.json()
      })
      .then((rows: { achievement_id: number }[]) => {
        setFavoritedIds(new Set(rows.map((r) => r.achievement_id)))
      })
      .catch((err) => console.error('[GameInfoTable] favorites fetch:', err))
  }, [gameData?.ID])

  const handleToggleFavorite = useCallback(
    async (achievement: RetroAchievement) => {
      const isFav = favoritedIds.has(achievement.ID)

      setFavoritedIds((prev) => {
        const next = new Set(prev)
        if (isFav) next.delete(achievement.ID)
        else next.add(achievement.ID)
        return next
      })

      try {
        if (isFav) {
          const res = await fetch(`/api/favorites?achievementId=${achievement.ID}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to unpin achievement')
        } else {
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              achievement,
              gameId: gameData?.ID,
              gameTitle: gameData?.Title,
              numDistinctPlayers,
            }),
          })
          if (!res.ok) throw new Error('Failed to pin achievement')
        }
      } catch (err) {
        console.error('[GameInfoTable] toggle favorite:', err)
        setFavoritedIds((prev) => {
          const next = new Set(prev)
          if (isFav) next.add(achievement.ID)
          else next.delete(achievement.ID)
          return next
        })
      }
    },
    [favoritedIds, gameData?.ID, gameData?.Title, numDistinctPlayers]
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

    const favGroup = list.filter((a) => favoritedIds.has(a.ID))
    const restGroup = list.filter((a) => !favoritedIds.has(a.ID))

    return [...sortGroup(favGroup), ...sortGroup(restGroup)]
  }, [achievements, filter, sortState, numDistinctPlayers, favoritedIds])

  function handleSort(key: SortKey) {
    setSortState((prev) =>
      prev.key === key
        ? { key, dir: (prev.dir === 'asc' ? 'desc' : 'asc') as SortDir }
        : { key, dir: DEFAULT_DIRS[key] }
    )
  }

  const needsToggle = filtered.length > COLLAPSED_ROWS

  return (
    <section className="bg-bg-card p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5 mb-5">
      {/* Missable warning */}
      {missableUnearned.length > 0 && (
        <div className="w-full border border-danger/40 rounded-xl overflow-hidden">
          <button
            onClick={() => setMissableOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-danger/10 hover:bg-danger/15 transition-colors text-left"
          >
            <span className="text-danger font-semibold text-sm uppercase tracking-wide">
              {T.gameInfoTable.missableWarning} ({missableUnearned.length})
            </span>
            <span className="text-danger text-xs">{missableOpen ? '▲' : '▼'}</span>
          </button>

          {missableOpen && (
            <div className="flex flex-col gap-2 p-4 bg-danger/5">
              {missableUnearned.map((a) => (
                <button
                  key={a.ID}
                  onClick={() => setSelectedAchievement(a)}
                  className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity text-left w-full rounded-lg hover:bg-danger/10 p-1 -m-1"
                >
                  {a.BadgeName && (
                    <Image
                      src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                      alt={a.Title}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 grayscale"
                    />
                  )}
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{a.Title}</p>
                    <p className="text-xs text-text-secondary">{a.Description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2">
        {(['all', 'earned', 'unearned'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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
        <button
          onClick={() => setTableExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-bg-header/40 hover:bg-bg-header/60 backdrop-blur-sm border border-white/5 transition-all group"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-text-main">
            <span className={`inline-block transition-transform duration-300 ${tableExpanded ? 'rotate-180' : ''}`}>
              <IconChevronDown className="w-4 h-4 text-accent" aria-hidden />
            </span>
            {tableExpanded ? T.gameInfoTable.collapseTable : `${T.gameInfoTable.expandTable} (${filtered.length})`}
          </span>
          <span className="text-xs text-text-secondary/60 bg-bg-main/30 px-2 py-0.5 rounded-full tabular-nums">
            {filtered.length} / {achievements.length}
          </span>
        </button>
      )}

      {gameData && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block w-full">
            <div
              className="relative"
              style={!tableExpanded && needsToggle ? { maxHeight: `${COLLAPSED_HEIGHT}px`, overflow: 'hidden' } : undefined}
            >
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
                  {filtered.map((achievement) => (
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

              {/* Fade overlay when collapsed */}
              {!tableExpanded && needsToggle && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-bg-card via-bg-card/80 to-transparent pointer-events-none" />
              )}
            </div>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden w-full">
            <div
              className="relative flex flex-col gap-2"
              style={!tableExpanded && needsToggle ? { maxHeight: `${COLLAPSED_ROWS * 110}px`, overflow: 'hidden' } : undefined}
            >
              {filtered.map((achievement) => (
                <GameInfoAchievementCard
                  key={achievement.ID}
                  achievement={achievement}
                  numDistinctPlayers={numDistinctPlayers}
                  isFavorited={favoritedIds.has(achievement.ID)}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              ))}

              {/* Fade overlay when collapsed */}
              {!tableExpanded && needsToggle && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-bg-card via-bg-card/80 to-transparent pointer-events-none" />
              )}
            </div>
          </div>

          {/* Expand / collapse toggle */}
          {needsToggle && (
            <button
              onClick={() => setTableExpanded((e) => !e)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-bg-header hover:bg-bg-header/80 text-text-secondary hover:text-text-main transition-colors self-center"
            >
              {tableExpanded ? (
                <>
                  <IconChevronUp className="w-4 h-4" />
                  {T.gameInfoTable.collapseTable}
                </>
              ) : (
                <>
                  <IconChevronDown className="w-4 h-4" />
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
