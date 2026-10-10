'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import {
  SteamSortableHeader,
  SteamSortKey,
  SteamSortState,
  STEAM_DEFAULT_DIRS,
} from '@/components/steam/steam-game-info-table/steam-sortable-header/SteamSortableHeader'
import PsnGameInfoTrophy from './psn-game-info-trophy/PsnGameInfoTrophy'
import PsnGameInfoTrophyCard from './psn-game-info-trophy-card/PsnGameInfoTrophyCard'
import PsnTrophyGroupTabs, { type GroupTab } from './psn-trophy-group-tabs/PsnTrophyGroupTabs'
import { usePsnFavoriteTrophies } from '@/hooks/usePsnFavoriteTrophies'
import type { PsnTrophy, PsnTrophyGroup } from '@/types/psn'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useLocationHash } from '@/hooks/useLocationHash'

type Filter = 'all' | 'earned' | 'unearned'

const COLLAPSED_ROWS = 3
const HIGHLIGHT_MS = 2500
const ANCHOR = '#trophy-'

function sortTrophies(list: PsnTrophy[], { key, dir }: SteamSortState): PsnTrophy[] {
  const cmp = (a: PsnTrophy, b: PsnTrophy): number => {
    // Unknown rarity sorts after known, whichever way the column runs.
    if (key === 'rarity') return (a.rarity ?? Infinity) - (b.rarity ?? Infinity)
    if (key === 'earned') {
      if (a.earned !== b.earned) return a.earned ? -1 : 1
      return (a.earnedAt ?? '').localeCompare(b.earnedAt ?? '')
    }
    return a.id - b.id
  }
  const sorted = [...list].sort(cmp)
  if (dir === 'desc') {
    // For "earned", newest first but locked ones still last.
    if (key === 'earned') {
      const earned = sorted.filter((t) => t.earned).reverse()
      return [...earned, ...sorted.filter((t) => !t.earned)]
    }
    return sorted.reverse()
  }
  return sorted
}

/**
 * A PSN game's trophies as a table (a card list on phones), matching
 * SteamGameInfoTable: all/earned/unearned filter, sortable columns (game
 * order, rarity, when earned), and fold to the first rows. A grade column
 * sits beside the name — a trophy's grade is what PSN is about.
 *
 * A game with DLC gets tabs over the table: everything, the base game, and
 * each DLC.
 *
 * Opening the page from a trophy link (…#trophy-<id>) scrolls to that trophy
 * and highlights it briefly. Each trophy can be pinned to the main page.
 */
export default function PsnGameInfoTable({
  trophies,
  groups = [],
  gameId,
  gameTitle,
}: {
  trophies: PsnTrophy[]
  groups?: PsnTrophyGroup[]
  gameId: number
  gameTitle: string
}) {
  const { T } = useLanguage()
  const { pinned, toggle, canPin } = usePsnFavoriteTrophies(gameId, gameTitle)
  const panelId = useId()
  const [groupTab, setGroupTab] = useState<GroupTab>('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SteamSortState>({ key: 'default', dir: 'asc' })
  const [expanded, setExpanded] = useState(true)
  const [highlighted, setHighlighted] = useState<number | null>(null)

  const FILTER_LABELS: Record<Filter, string> = {
    all: T.gameInfoTable.filterAll,
    earned: T.gameInfoTable.filterEarned,
    unearned: T.gameInfoTable.filterUnearned,
  }

  // Deep link from a trophy: show it (state, so while rendering), then scroll to
  // the visible copy (row on desktop, card on phones) and light it up for a moment.
  const hash = useLocationHash()
  const linkedId = hash.startsWith(ANCHOR) ? Number(hash.slice(ANCHOR.length)) : null
  const linked = linkedId !== null && trophies.some((t) => t.id === linkedId)

  useWhenChanged([linked ? linkedId : null, trophies], () => {
    if (!linked) return
    setFilter('all')
    setGroupTab('all')
    setExpanded(true)
    setHighlighted(linkedId)
  })

  useEffect(() => {
    if (!linked) return
    const id = linkedId
    const target = [...document.querySelectorAll<HTMLElement>('[data-trophy]')].find(
      (el) => el.dataset.trophy === String(id) && el.offsetParent !== null,
    )
    target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [linked, linkedId, trophies])

  const filtered = useMemo(() => {
    const inGroup = groupTab === 'all' ? trophies : trophies.filter((t) => t.groupId === groupTab)
    const list =
      filter === 'earned' ? inGroup.filter((t) => t.earned) : filter === 'unearned' ? inGroup.filter((t) => !t.earned) : inGroup
    return sortTrophies(list, sortState)
  }, [trophies, filter, sortState, groupTab])

  function handleSort(key: SteamSortKey) {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: STEAM_DEFAULT_DIRS[key] },
    )
  }

  const needsToggle = filtered.length > COLLAPSED_ROWS
  const shown = expanded || !needsToggle ? filtered : filtered.slice(0, COLLAPSED_ROWS)

  return (
    <section className="bg-bg-card p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5 mb-5">
      {groups.length > 1 && <PsnTrophyGroupTabs groups={groups} selected={groupTab} onSelect={setGroupTab} panelId={panelId} />}
      <div className="flex gap-2 flex-wrap" role="group" aria-label={T.psn.trophies}>
        {(['all', 'earned', 'unearned'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1] ${
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
        <p className="text-sm text-text-secondary self-center py-4">{T.psn.noTrophies}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div id={panelId} className="hidden sm:block w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-sm border-b border-bg-header">
                  <th className="px-3 py-2 w-24 text-center text-text-secondary">{T.gameInfoTable.headerIcon}</th>
                  <SteamSortableHeader sortKey="default" sortState={sortState} onSort={handleSort} className="text-left">
                    {T.psn.trophy}
                  </SteamSortableHeader>
                  <th className="px-3 py-2 w-28 text-center text-text-secondary">{T.psn.grade}</th>
                  <SteamSortableHeader sortKey="rarity" sortState={sortState} onSort={handleSort} className="w-28 text-center">
                    {T.gameInfoTable.headerRarity}
                  </SteamSortableHeader>
                  <SteamSortableHeader sortKey="earned" sortState={sortState} onSort={handleSort} className="w-44 text-center">
                    {T.gameInfoTable.headerEarned}
                  </SteamSortableHeader>
                  {canPin && <th className="w-12" aria-label={T.favorites.title} />}
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <PsnGameInfoTrophy
                    key={t.id}
                    trophy={t}
                    highlighted={highlighted === t.id}
                    pinned={canPin ? pinned.has(t.id) : undefined}
                    onTogglePin={() => toggle(t)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone card list */}
          <ul className="sm:hidden w-full flex flex-col gap-2">
            {shown.map((t) => (
              <PsnGameInfoTrophyCard
                key={t.id}
                trophy={t}
                highlighted={highlighted === t.id}
                pinned={canPin ? pinned.has(t.id) : undefined}
                onTogglePin={() => toggle(t)}
              />
            ))}
          </ul>

          {needsToggle && (
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-bg-header hover:bg-bg-header/80 text-text-secondary hover:text-text-main transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1]"
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
