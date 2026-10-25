'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import { useRevealedTrophies } from '@/hooks/useRevealedTrophies'
import { useLocationHash } from '@/hooks/useLocationHash'
import { guideLinks } from '@/utils/guideLinks'
import { BASE_GROUP, dlcShortName, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import AchievementDetailModal from '@/components/achievement-detail-modal/AchievementDetailModal'
import AchievementTableToolbar from '@/components/achievement-table-toolbar/AchievementTableToolbar'
import ShowRestButton from '@/components/show-rest-button/ShowRestButton'
import { SURFACE } from '@/components/ui/surface'
import { TABLE, TH } from '@/components/ui/dataTable'
import { buttonClass } from '@/components/ui/Button'

type Filter = 'all' | 'earned' | 'unearned'

/** Rows shown before "show the other N". */
const FIRST_ROWS = 8
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
 * SteamGameInfoTable: all/earned/unearned tabs with their counts, a search,
 * sortable columns (game order, rarity, when earned), and the first rows then
 * a button for the rest. A grade column
 * sits beside the name — a trophy's grade is what PSN is about.
 *
 * A game with DLC gets tabs over the table: everything, the base game, and
 * each DLC.
 *
 * Opening the page from a trophy link (…#trophy-<id>) scrolls to that trophy
 * and highlights it briefly. Each trophy can be pinned to the main page, and
 * the ones pinned when it loaded lead the list; each opens in a detail window with links to
 * guides.
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
  const { pinned, leading, toggle, canPin } = usePsnFavoriteTrophies(gameId, gameTitle)
  const panelId = useId()
  const [groupTab, setGroupTab] = useState<GroupTab>('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SteamSortState>({ key: 'default', dir: 'asc' })
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [selected, setSelected] = useState<PsnTrophy | null>(null)
  const { isRevealed, toggle: toggleOne, setAll } = useRevealedTrophies()

  // Deep link from a trophy: show it (state, so while rendering), then scroll to
  // the visible copy (row on desktop, card on phones) and light it up for a moment.
  const hash = useLocationHash()
  const linkedId = hash.startsWith(ANCHOR) ? Number(hash.slice(ANCHOR.length)) : null
  const linked = linkedId !== null && trophies.some((t) => t.id === linkedId)

  useWhenChanged([linked ? linkedId : null, trophies], () => {
    if (!linked) return
    setFilter('all')
    setGroupTab('all')
    setQuery('')
    setShowAll(true)
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
    let list =
      filter === 'earned' ? inGroup.filter((t) => t.earned) : filter === 'unearned' ? inGroup.filter((t) => !t.earned) : inGroup
    // Searched by what is shown: a secret one by its hidden label, not its text.
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((t) => (t.hidden && !t.earned && !isRevealed(t.id) ? T.psn.hiddenTrophy : `${t.name} ${t.detail}`).toLowerCase().includes(q))
    const sorted = sortTrophies(list, sortState)
    // Pinned first, each part in the chosen order — as RA's table does.
    return canPin ? [...sorted.filter((t) => leading.has(t.id)), ...sorted.filter((t) => !leading.has(t.id))] : sorted
  }, [trophies, filter, query, sortState, groupTab, canPin, leading, isRevealed, T.psn.hiddenTrophy])

  function handleSort(key: SteamSortKey) {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: STEAM_DEFAULT_DIRS[key] },
    )
  }

  const GRADE_LABEL = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }
  const secrets = trophies.filter((t) => t.hidden && !t.earned)
  const allRevealed = secrets.length > 0 && secrets.every((t) => isRevealed(t.id))
  const folded = !showAll && !query.trim() && filtered.length > FIRST_ROWS
  const shown = folded ? filtered.slice(0, FIRST_ROWS) : filtered
  const inGroup = groupTab === 'all' ? trophies : trophies.filter((t) => t.groupId === groupTab)
  const earnedCount = inGroup.filter((t) => t.earned).length

  return (
    <div className="w-full px-4 sm:px-8 lg:px-14 mt-7 mb-7">
    <section aria-label={T.psn.trophies} className={`${SURFACE} p-4 sm:p-6 flex flex-col gap-4`}>
      {groups.length > 1 && <PsnTrophyGroupTabs groups={groups} selected={groupTab} onSelect={setGroupTab} panelId={panelId} gameTitle={gameTitle} />}
      <AchievementTableToolbar<Filter, SteamSortKey>
        label={T.psn.trophies}
        tabs={[
          { value: 'all', label: T.gameInfoTable.filterAll, count: inGroup.length },
          { value: 'earned', label: T.gameInfoTable.filterEarned, count: earnedCount },
          { value: 'unearned', label: T.gameInfoTable.filterUnearned, count: inGroup.length - earnedCount },
        ]}
        filter={filter}
        onFilter={setFilter}
        query={query}
        onQuery={setQuery}
        sortOptions={[
          { value: 'default', label: T.gameInfoTable.sortGameOrder },
          { value: 'rarity', label: T.gameInfoTable.headerRarity },
          { value: 'earned', label: T.gameInfoTable.headerEarned },
        ]}
        sort={sortState.key}
        onSort={(key) => setSortState({ key, dir: STEAM_DEFAULT_DIRS[key] })}
        extra={
          secrets.length > 0 && (
            <button type="button" onClick={() => setAll(secrets.map((t) => t.id), !allRevealed)} aria-pressed={allRevealed} className={buttonClass('quiet', 'sm')}>
              {allRevealed ? T.psn.hideHiddenTrophies : T.psn.showHiddenTrophies}
            </button>
          )
        }
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-text-secondary self-center py-6">{query.trim() ? T.gameInfoTable.noMatches : T.psn.noTrophies}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div id={panelId} className="hidden sm:block w-full">
            <table className={TABLE}>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} w-16`}>
                    <span className="sr-only">{T.gameInfoTable.headerIcon}</span>
                  </th>
                  <SteamSortableHeader sortKey="default" sortState={sortState} onSort={handleSort}>
                    {T.psn.trophy}
                  </SteamSortableHeader>
                  <th scope="col" className={`${TH} text-center w-24`}>{T.psn.grade}</th>
                  <SteamSortableHeader sortKey="rarity" sortState={sortState} onSort={handleSort} align="center" className="w-28">
                    {T.gameInfoTable.headerRarity}
                  </SteamSortableHeader>
                  <SteamSortableHeader sortKey="earned" sortState={sortState} onSort={handleSort} align="right" className="w-28">
                    {T.gameInfoTable.headerEarned}
                  </SteamSortableHeader>
                  {canPin && (
                    <th scope="col" className={`${TH} w-12`}>
                      <span className="sr-only">{T.favorites.title}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <PsnGameInfoTrophy
                    key={t.id}
                    trophy={t}
                    highlighted={highlighted === t.id}
                    revealed={isRevealed(t.id)}
                    onToggleReveal={() => toggleOne(t.id)}
                    pinned={canPin ? pinned.has(t.id) : undefined}
                    onTogglePin={() => toggle(t)}
                    onOpen={() => setSelected(t)}
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
                revealed={isRevealed(t.id)}
                onToggleReveal={() => toggleOne(t.id)}
                pinned={canPin ? pinned.has(t.id) : undefined}
                onTogglePin={() => toggle(t)}
                onOpen={() => setSelected(t)}
              />
            ))}
          </ul>

          {(folded || (showAll && filtered.length > FIRST_ROWS && !query.trim())) && (
            <ShowRestButton folded={folded} rest={filtered.length - FIRST_ROWS} onToggle={() => setShowAll((v) => !v)} />
          )}
        </>
      )}

      <AnimatePresence>
        {selected && (() => {
          const concealed = selected.hidden && !selected.earned && !isRevealed(selected.id)
          const group = groups.length > 1 ? groups.find((g) => g.id === selected.groupId && g.id !== BASE_GROUP) : undefined
          return (
            <AchievementDetailModal
              key={selected.id}
              title={concealed ? T.psn.hiddenTrophy : selected.name}
              description={concealed ? T.psn.hiddenTrophyDesc : selected.detail}
              iconUrl={concealed ? null : selected.iconUrl}
              earned={selected.earned}
              earnedAt={selected.earnedAt}
              rarity={selected.rarity}
              tags={
                <>
                  <span className={`font-semibold ${TROPHY_GRADE_COLOR[selected.type]}`}>{GRADE_LABEL[selected.type]}</span>
                  {group && <span className="px-2 py-0.5 rounded-full bg-ink/10 text-text-secondary">DLC · {dlcShortName(group.name, gameTitle)}</span>}
                </>
              }
              guides={concealed ? [] : guideLinks('psn', { gameTitle, title: selected.name })}
              pinned={canPin ? pinned.has(selected.id) : undefined}
              onTogglePin={() => toggle(selected)}
              showcase={
                selected.earned && selected.earnedAt
                  ? { source: 'psn', gameId, achievementKey: String(selected.id), gameTitle, title: selected.name, description: selected.detail || null, badge: selected.iconUrl, earnedAt: selected.earnedAt }
                  : null
              }
              onClose={() => setSelected(null)}
            />
          )
        })()}
      </AnimatePresence>
    </section>
    </div>
  )
}
