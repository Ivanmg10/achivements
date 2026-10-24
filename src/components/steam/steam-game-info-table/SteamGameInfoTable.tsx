'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamFavoriteAchievements } from '@/hooks/useSteamFavoriteAchievements'
import SteamGameInfoAchievement from './steam-game-info-achievement/SteamGameInfoAchievement'
import SteamGameInfoAchievementCard from './steam-game-info-achievement-card/SteamGameInfoAchievementCard'
import {
  SteamSortableHeader,
  SteamSortKey,
  SteamSortState,
  STEAM_DEFAULT_DIRS,
} from './steam-sortable-header/SteamSortableHeader'
import type { SteamAchievementUnified } from '@/types/steam'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useLocationHash } from '@/hooks/useLocationHash'
import { guideLinks } from '@/utils/guideLinks'
import GameInfoTableFoldBar from '@/components/game-info-table-fold-bar/GameInfoTableFoldBar'
import AchievementWarningPanel from '@/components/achievement-warning-panel/AchievementWarningPanel'
import AchievementDetailModal from '@/components/achievement-detail-modal/AchievementDetailModal'
import SteamOnlineBadge from '@/components/steam/steam-online-badge/SteamOnlineBadge'
import { tabClass, TAB_ROW } from '@/components/ui/Tabs'

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
 * achievement and highlights it briefly. Each achievement can be pinned to
 * the main page, as RA's table does, and the ones pinned when it loaded lead the list; each
 * opens in a detail window with links to guides. The ones that likely need
 * online play and are still locked are listed in a warning above, as RA
 * lists its missables — servers close.
 */
export default function SteamGameInfoTable({
  achievements,
  appId,
  gameTitle,
}: {
  achievements: SteamAchievementUnified[]
  appId: number
  gameTitle: string
}) {
  const { T } = useLanguage()
  const { pinned, leading, toggle, canPin } = useSteamFavoriteAchievements(appId, gameTitle)
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SteamSortState>({ key: 'default', dir: 'asc' })
  const [expanded, setExpanded] = useState(true)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [selected, setSelected] = useState<SteamAchievementUnified | null>(null)

  const FILTER_LABELS: Record<Filter, string> = {
    all: T.gameInfoTable.filterAll,
    earned: T.gameInfoTable.filterEarned,
    unearned: T.gameInfoTable.filterUnearned,
  }

  // Deep link from a badge: show it (state, so while rendering), then scroll to
  // the visible copy (table row on desktop, card on phones) once the list is there.
  const hash = useLocationHash()
  const linkedApiname = hash.startsWith('#ach-') ? decodeURIComponent(hash.slice('#ach-'.length)) : null
  const linked = linkedApiname !== null && achievements.some((a) => a.apiname === linkedApiname)

  useWhenChanged([linked ? linkedApiname : null, achievements], () => {
    if (!linked) return
    setFilter('all')
    setExpanded(true)
    setHighlighted(linkedApiname)
  })

  useEffect(() => {
    if (!linked || linkedApiname === null) return
    const apiname = linkedApiname
    // Compare the attribute rather than build a selector from the URL: no
    // escaping to get wrong, whatever characters an apiname holds.
    const target = [...document.querySelectorAll<HTMLElement>('[data-ach]')].find(
      (el) => el.dataset.ach === apiname && el.offsetParent !== null,
    )
    target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [linked, linkedApiname, achievements])

  const filtered = useMemo(() => {
    const list =
      filter === 'earned'
        ? achievements.filter((a) => a.earned)
        : filter === 'unearned'
          ? achievements.filter((a) => !a.earned)
          : achievements
    const sorted = sortAchievements(list, sortState)
    // Pinned first, each part in the chosen order — as RA's table does.
    return canPin ? [...sorted.filter((a) => leading.has(a.apiname)), ...sorted.filter((a) => !leading.has(a.apiname))] : sorted
  }, [achievements, filter, sortState, canPin, leading])

  const onlineLocked = useMemo(() => achievements.filter((a) => a.likelyOnline && !a.earned), [achievements])

  function handleSort(key: SteamSortKey) {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: STEAM_DEFAULT_DIRS[key] },
    )
  }

  const needsToggle = filtered.length > COLLAPSED_ROWS
  const shown = expanded || !needsToggle ? filtered : filtered.slice(0, COLLAPSED_ROWS)

  return (
    <section className="bg-bg-card p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5 mb-5">
      <AchievementWarningPanel
        tone="warning"
        label={T.steam.onlineWarning}
        items={onlineLocked.map((a) => ({
          key: a.apiname,
          title: a.hidden ? T.steam.hiddenAchievement : a.title,
          description: a.hidden ? T.steam.hiddenAchievementDesc : a.description,
          iconUrl: a.badgeUrl || null,
          onSelect: () => setSelected(a),
        }))}
      />

      <div className={TAB_ROW} role="group" aria-label={T.gameInfoPage.achievements}>
        {(['all', 'earned', 'unearned'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={tabClass(filter === f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {needsToggle && (
        <GameInfoTableFoldBar expanded={expanded} onToggle={() => setExpanded((e) => !e)} shown={filtered.length} total={achievements.length} />
      )}

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
                  {canPin && <th className="w-12" aria-label={T.favorites.title} />}
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => (
                  <SteamGameInfoAchievement
                    key={a.apiname}
                    achievement={a}
                    highlighted={highlighted === a.apiname}
                    pinned={canPin ? pinned.has(a.apiname) : undefined}
                    onTogglePin={() => toggle(a)}
                    onOpen={() => setSelected(a)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone card list */}
          <ul className="sm:hidden w-full flex flex-col gap-2">
            {shown.map((a) => (
              <SteamGameInfoAchievementCard
                key={a.apiname}
                achievement={a}
                highlighted={highlighted === a.apiname}
                pinned={canPin ? pinned.has(a.apiname) : undefined}
                onTogglePin={() => toggle(a)}
                onOpen={() => setSelected(a)}
              />
            ))}
          </ul>

          {needsToggle && (
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-bg-header hover:bg-bg-header/80 text-text-secondary hover:text-text-main transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
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

      <AnimatePresence>
        {selected && (
          <AchievementDetailModal
            title={selected.hidden && !selected.earned ? T.steam.hiddenAchievement : selected.title}
            description={selected.hidden && !selected.earned ? T.steam.hiddenAchievementDesc : selected.description}
            iconUrl={selected.badgeUrl || null}
            earned={selected.earned}
            earnedAt={selected.dateEarned}
            rarity={selected.globalPct}
            tags={selected.likelyOnline ? <SteamOnlineBadge /> : undefined}
            guides={selected.hidden && !selected.earned ? [] : guideLinks('steam', { gameTitle, title: selected.titleEn ?? selected.title, appId })}
            pinned={canPin ? pinned.has(selected.apiname) : undefined}
            onTogglePin={() => toggle(selected)}
            showcase={
              selected.earned && selected.dateEarned
                ? { source: 'steam', gameId: appId, achievementKey: selected.apiname, gameTitle, title: selected.title, description: selected.description || null, badge: selected.badgeUrl || null, earnedAt: selected.dateEarned }
                : null
            }
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
