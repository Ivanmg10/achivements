'use client'

import {
  RetroAchievement,
  RetroAchievementsGameWithAchievements,
} from '@/types/types'
import GameInfoAchivement from '../game-info-achivement/GameInfoAchivement'
import AchievementModal from '../achievement-modal/AchievementModal'
import Image from 'next/image'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type Filter = 'all' | 'earned' | 'unearned'
type SortKey = 'default' | 'points' | 'rarity' | 'players' | 'hc' | 'earned'
type SortDir = 'asc' | 'desc'
type SortState = { key: SortKey; dir: SortDir }

const DEFAULT_DIRS: Record<SortKey, SortDir> = {
  default: 'asc',
  points: 'desc',
  rarity: 'asc',
  players: 'desc',
  hc: 'desc',
  earned: 'desc',
}

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
      .then((r) => r.json())
      .then((rows: { achievement_id: number }[]) => {
        setFavoritedIds(new Set(rows.map((r) => r.achievement_id)))
      })
      .catch(() => {})
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

      if (isFav) {
        await fetch(`/api/favorites?achievementId=${achievement.ID}`, { method: 'DELETE' })
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            achievement,
            gameId: gameData?.ID,
            gameTitle: gameData?.Title,
            numDistinctPlayers,
          }),
        })
      }
    },
    [favoritedIds, gameData?.ID, gameData?.Title, numDistinctPlayers],
  )

  const achievements = useMemo(() => {
    if (!gameData) return []
    return Object.values(gameData.Achievements ?? {}).filter(
      (a): a is RetroAchievement => a !== undefined,
    )
  }, [gameData])

  const missableUnearned = useMemo(
    () => achievements.filter((a) => a.Type === 'missable' && !a.DateEarned),
    [achievements],
  )

  const filtered = useMemo(() => {
    let list: RetroAchievement[]
    if (filter === 'earned') list = achievements.filter((a) => !!a.DateEarned)
    else if (filter === 'unearned') list = achievements.filter((a) => !a.DateEarned)
    else list = achievements

    const { key, dir } = sortState

    const sortFn = (a: RetroAchievement, b: RetroAchievement): number => {
      if (key === 'points') return b.Points - a.Points
      if (key === 'rarity') return a.NumAwarded / numDistinctPlayers - b.NumAwarded / numDistinctPlayers
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
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: DEFAULT_DIRS[key] },
    )
  }

  function SortableHeader({
    sortKey,
    children,
    className,
  }: {
    sortKey: SortKey
    children: React.ReactNode
    className?: string
  }) {
    const active = sortState.key === sortKey
    const arrow = active ? (sortState.dir === 'asc' ? ' ↑' : ' ↓') : ''
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className={`px-3 py-2 cursor-pointer select-none transition-colors hover:text-text-main ${
          active ? 'text-text-main' : 'text-text-secondary'
        } ${className ?? ''}`}
      >
        {children}{arrow}
      </th>
    )
  }

  return (
    <section className="bg-bg-main p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5 mb-5">
      {missableUnearned.length > 0 && (
        <div className="w-full border border-red-800/50 rounded-xl overflow-hidden">
          <button
            onClick={() => setMissableOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-950/40 hover:bg-red-950/60 transition-colors text-left"
          >
            <span className="text-red-400 font-semibold text-sm uppercase tracking-wide">
              {T.gameInfoTable.missableWarning} ({missableUnearned.length})
            </span>
            <span className="text-red-400 text-xs">{missableOpen ? '▲' : '▼'}</span>
          </button>

          {missableOpen && (
            <div className="flex flex-col gap-2 p-4 bg-red-950/20">
              {missableUnearned.map((a) => (
                <div key={a.ID} className="flex items-center gap-3 opacity-80">
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {gameData && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-sm border-b border-bg-header">
              <th className="px-3 py-2 w-24 text-center text-text-secondary">{T.gameInfoTable.headerIcon}</th>
              <SortableHeader sortKey="default" className="text-left">
                {T.gameInfoTable.headerAchievement}
              </SortableHeader>
              <SortableHeader sortKey="players" className="w-48 text-center hidden sm:table-cell">
                {T.gameInfoTable.headerPlayers}
              </SortableHeader>
              <SortableHeader sortKey="hc" className="w-48 text-center hidden sm:table-cell">
                {T.gameInfoTable.headerHC}
              </SortableHeader>
              <SortableHeader sortKey="rarity" className="w-36 text-center hidden sm:table-cell">
                {T.gameInfoTable.headerRarity}
              </SortableHeader>
              <SortableHeader sortKey="earned" className="w-40 text-center hidden sm:table-cell">
                {T.gameInfoTable.headerEarned}
              </SortableHeader>
              <SortableHeader sortKey="points" className="w-28 text-center">
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
      )}

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
    </section>
  )
}
