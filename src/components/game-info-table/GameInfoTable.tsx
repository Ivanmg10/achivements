'use client'

import {
  RetroAchievement,
  RetroAchievementsGameWithAchievements,
} from '@/types/types'
import GameInfoAchivement from '../game-info-achivement/GameInfoAchivement'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type Filter = 'all' | 'earned' | 'unearned'
type SortKey = 'default' | 'points' | 'rarity'
type SortDir = 'asc' | 'desc'
type SortState = { key: SortKey; dir: SortDir }

const DEFAULT_DIRS: Record<SortKey, SortDir> = {
  default: 'asc',
  points: 'desc',
  rarity: 'asc',
}

export default function GameInfoTable({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SortState>({ key: 'default', dir: 'asc' })
  const [missableOpen, setMissableOpen] = useState(false)
  const { T } = useLanguage()

  const SORT_LABELS: Record<SortKey, string> = {
    default: T.gameInfoTable.sortOrder,
    points: T.gameInfoTable.sortPoints,
    rarity: T.gameInfoTable.sortRarity,
  }

  const FILTER_LABELS: Record<Filter, string> = {
    all: T.gameInfoTable.filterAll,
    earned: T.gameInfoTable.filterEarned,
    unearned: T.gameInfoTable.filterUnearned,
  }

  const numDistinctPlayers = gameData?.NumDistinctPlayers ?? 1

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
    const sorted = [...list].sort((a, b) => {
      if (key === 'points') return b.Points - a.Points
      if (key === 'rarity') return a.NumAwarded / numDistinctPlayers - b.NumAwarded / numDistinctPlayers
      return a.DisplayOrder - b.DisplayOrder
    })

    return dir === 'desc' ? sorted.reverse() : sorted
  }, [achievements, filter, sortState, numDistinctPlayers])

  function handleSort(key: SortKey) {
    setSortState((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: DEFAULT_DIRS[key] },
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

      <div className="flex items-center gap-3 w-full flex-wrap">
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

        <div className="flex gap-2 ml-auto">
          {(['default', 'points', 'rarity'] as SortKey[]).map((s) => {
            const active = sortState.key === s
            const arrow = active ? (sortState.dir === 'asc' ? ' ↑' : ' ↓') : ''
            return (
              <button
                key={s}
                onClick={() => handleSort(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'bg-bg-header text-text-main ring-1 ring-text-secondary/30'
                    : 'bg-bg-card/60 text-text-secondary hover:text-text-main hover:bg-bg-card'
                }`}
              >
                {SORT_LABELS[s]}{arrow}
              </button>
            )
          })}
        </div>
      </div>

      {gameData && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-text-secondary text-sm border-b border-bg-header">
              <th className="p-2 w-20">{T.gameInfoTable.headerIcon}</th>
              <th className="p-2">{T.gameInfoTable.headerAchievement}</th>
              <th className="p-2 w-56">{T.gameInfoTable.headerPlayers}</th>
              <th className="p-2 w-20">{T.gameInfoTable.headerPoints}</th>
              <th className="p-2 w-20">{T.gameInfoTable.headerEarned}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((achievement) => (
              <GameInfoAchivement
                achievement={achievement}
                numDistinctPlayers={numDistinctPlayers}
                key={achievement.ID}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
