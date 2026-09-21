'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SteamGameInfoAchievement from './steam-game-info-achievement/SteamGameInfoAchievement'
import SteamGameInfoAchievementCard from './steam-game-info-achievement-card/SteamGameInfoAchievementCard'
import {
  SteamSortableHeader,
  SteamSortKey,
  SteamSortState,
  STEAM_DEFAULT_DIRS,
} from './steam-sortable-header/SteamSortableHeader'
import type { SteamAchievementUnified } from '@/types/steam'

type Filter = 'all' | 'earned' | 'unearned'

const COLLAPSED_ROWS = 3
const HIGHLIGHT_MS = 2500

function sortAchievements(list: SteamAchievementUnified[], { key, dir }: SteamSortState): SteamAchievementUnified[] {
  const cmp = (a: SteamAchievementUnified, b: SteamAchievementUnified): number => {
    // Unknown rarity sorts after known, whichever way the column runs.
    if (key === 'rarity') return (a.globalPct ?? Infinity) - (b.globalPct ?? Infinity)
    if (key === 'earned') {
      if (a.earned !== b.earned) return a.earned ? -1 : 1
      return (a.dateEarned ?? '').localeCompare(b.dateEarned ?? '')
    }
    return a.displayOrder - b.displayOrder
  }
  const sorted = [...list].sort(cmp)
  if (dir === 'desc') {
    // For "earned", newest unlock first but locked ones still last.
    if (key === 'earned') {
      const earned = sorted.filter((a) => a.earned).reverse()
      return [...earned, ...sorted.filter((a) => !a.earned)]
    }
    return sorted.reverse()
  }
  return sorted
}

/**
 * A Steam game's achievements as a table (a card list on phones), matching
 * RA's GameInfoTable: all/earned/unearned filter, sortable columns (order,
 * rarity, unlock date), and fold to the first rows.
 *
 * Opening the page from a badge link (…#ach-<apiname>) scrolls to that
 * achievement and highlights it briefly.
 */
export default function SteamGameInfoTable({ achievements }: { achievements: SteamAchievementUnified[] }) {
  const { T } = useLanguage()
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SteamSortState>({ key: 'default', dir: 'asc' })
  const [expanded, setExpanded] = useState(true)
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const FILTER_LABELS: Record<Filter, string> = {
    all: T.gameInfoTable.filterAll,
    earned: T.gameInfoTable.filterEarned,
    unearned: T.gameInfoTable.filterUnearned,
  }

  // Deep link from a badge: scroll to the visible copy (table row on desktop,
  // card on phones) once the list is there.
  useEffect(() => {
    if (achievements.length === 0) return
    const hash = window.location.hash
    if (!hash.startsWith('#ach-')) return
    const apiname = decodeURIComponent(hash.slice('#ach-'.length))
    if (!achievements.some((a) => a.apiname === apiname)) return

    setFilter('all')
    setExpanded(true)
    setHighlighted(apiname)
    // Compare the attribute rather than build a selector from the URL: no
    // escaping to get wrong, whatever characters an apiname holds.
    const target = [...document.querySelectorAll<HTMLElement>('[data-ach]')].find(
      (el) => el.dataset.ach === apiname && el.offsetParent !== null,
    )
    target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [achievements])

  const filtered = useMemo(() => {
    const list =
      filter === 'earned'
        ? achievements.filter((a) => a.earned)
        : filter === 'unearned'
          ? achievements.filter((a) => !a.earned)
          : achievements
    return sortAchievements(list, sortState)
  }, [achievements, filter, sortState])

  function handleSort(key: SteamSortKey) {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: STEAM_DEFAULT_DIRS[key] },
    )
  }

  const needsToggle = filtered.length > COLLAPSED_ROWS
  const shown = expanded || !needsToggle ? filtered : filtered.slice(0, COLLAPSED_ROWS)

  return (
    <section className="bg-bg-card p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5 mb-5">
      <div className="flex gap-2 flex-wrap" role="group" aria-label={T.gameInfoPage.achievements}>
        {(['all', 'earned', 'unearned'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] ${
              filter === f
                ? 'bg-bg-header text-text-main ring-1 ring-text-secondary/30'
                : 'bg-bg-card/60 text-text-secondary hover:text-text-main hover:bg-bg-card'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-secondary self-center py-4">{T.steam.noAchievements}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-sm border-b border-bg-header">
                  <th className="px-3 py-2 w-24 text-center text-text-secondary">{T.gameInfoTable.headerIcon}</th>
                  <SteamSortableHeader sortKey="default" sortState={sortState} onSort={handleSort} className="text-left">
                    {T.gameInfoTable.headerAchievement}
                  </SteamSortableHeader>
                  <SteamSortableHeader sortKey="rarity" sortState={sortState} onSort={handleSort} className="w-32 text-center">
                    {T.gameInfoTable.headerRarity}
                  </SteamSortableHeader>
                  <SteamSortableHeader sortKey="earned" sortState={sortState} onSort={handleSort} className="w-44 text-center">
                    {T.gameInfoTable.headerEarned}
                  </SteamSortableHeader>
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => (
                  <SteamGameInfoAchievement key={a.apiname} achievement={a} highlighted={highlighted === a.apiname} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone card list */}
          <ul className="sm:hidden w-full flex flex-col gap-2">
            {shown.map((a) => (
              <SteamGameInfoAchievementCard key={a.apiname} achievement={a} highlighted={highlighted === a.apiname} />
            ))}
          </ul>

          {needsToggle && (
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-bg-header hover:bg-bg-header/80 text-text-secondary hover:text-text-main transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
            >
              {expanded ? (
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
    </section>
  )
}
