'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import MissableNotice from '@/components/missable-notice/MissableNotice'
import AchievementTableToolbar from '@/components/achievement-table-toolbar/AchievementTableToolbar'
import ShowRestButton from '@/components/show-rest-button/ShowRestButton'
import { SURFACE } from '@/components/ui/surface'
import { TABLE, TH } from '@/components/ui/dataTable'
import { plural } from '@/utils/utils'
import AchievementDetailModal from '@/components/achievement-detail-modal/AchievementDetailModal'
import SteamOnlineBadge from '@/components/steam/steam-online-badge/SteamOnlineBadge'
type Filter = 'all' | 'earned' | 'unearned' | 'online'

/** Rows shown before "show the other N". */
const FIRST_ROWS = 8
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
 * RA's GameInfoTable: all/earned/unearned tabs with their counts, a search,
 * sortable columns (order, rarity, unlock date), and the first rows then a
 * button for the rest.
 *
 * Opening the page from a badge link (…#ach-<apiname>) scrolls to that
 * achievement and highlights it briefly. Each achievement can be pinned to
 * the main page, as RA's table does, and the ones pinned when it loaded lead the list; each
 * opens in a detail window with links to guides. The ones that likely need
 * online play and are still locked are named in a line above, as RA's
 * missables, with a button that keeps only them — servers close.
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
  const { T, lang } = useLanguage()
  const { pinned, leading, toggle, canPin } = useSteamFavoriteAchievements(appId, gameTitle)
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SteamSortState>({ key: 'default', dir: 'asc' })
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [selected, setSelected] = useState<SteamAchievementUnified | null>(null)

  // Deep link from a badge: show it (state, so while rendering), then scroll to
  // the visible copy (table row on desktop, card on phones) once the list is there.
  const hash = useLocationHash()
  const linkedApiname = hash.startsWith('#ach-') ? decodeURIComponent(hash.slice('#ach-'.length)) : null
  const linked = linkedApiname !== null && achievements.some((a) => a.apiname === linkedApiname)

  useWhenChanged([linked ? linkedApiname : null, achievements], () => {
    if (!linked) return
    setFilter('all')
    setQuery('')
    setShowAll(true)
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

  const onlineLocked = useMemo(() => achievements.filter((a) => a.likelyOnline && !a.earned), [achievements])

  const filtered = useMemo(() => {
    let list =
      filter === 'earned'
        ? achievements.filter((a) => a.earned)
        : filter === 'unearned'
          ? achievements.filter((a) => !a.earned)
          : filter === 'online'
            ? onlineLocked
            : achievements
    // Searched by what is shown: a secret one by its hidden label, not its text.
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((a) => (a.hidden && !a.earned ? T.steam.hiddenAchievement : `${a.title} ${a.description}`).toLowerCase().includes(q))
    const sorted = sortAchievements(list, sortState)
    // Pinned first, each part in the chosen order — as RA's table does.
    return canPin ? [...sorted.filter((a) => leading.has(a.apiname)), ...sorted.filter((a) => !leading.has(a.apiname))] : sorted
  }, [achievements, onlineLocked, filter, query, sortState, canPin, leading, T.steam.hiddenAchievement])

  function handleSort(key: SteamSortKey) {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: STEAM_DEFAULT_DIRS[key] },
    )
  }

  const folded = !showAll && !query.trim() && filtered.length > FIRST_ROWS
  const shown = folded ? filtered.slice(0, FIRST_ROWS) : filtered
  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <div className="w-full px-4 sm:px-8 lg:px-14 mt-7 mb-7">
    <section aria-label={T.gameInfoPage.achievements} className={`${SURFACE} p-4 sm:p-6 flex flex-col gap-4`}>
      <MissableNotice
        tone="warning"
        lead={plural(onlineLocked.length, T.plurals.onlineCount, lang)}
        text={T.gameInfoTable.onlineText}
        names={onlineLocked.map((a) => (a.hidden ? T.steam.hiddenAchievement : a.title))}
        only={filter === 'online'}
        onToggleOnly={() => setFilter((f) => (f === 'online' ? 'all' : 'online'))}
      />

      <AchievementTableToolbar<Filter, SteamSortKey>
        label={T.gameInfoPage.achievements}
        tabs={[
          { value: 'all', label: T.gameInfoTable.filterAll, count: achievements.length },
          { value: 'earned', label: T.gameInfoTable.filterEarned, count: earnedCount },
          { value: 'unearned', label: T.gameInfoTable.filterUnearned, count: achievements.length - earnedCount },
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
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-text-secondary self-center py-6">{query.trim() ? T.gameInfoTable.noMatches : T.steam.noAchievements}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block w-full">
            <table className={TABLE}>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} w-16`}>
                    <span className="sr-only">{T.gameInfoTable.headerIcon}</span>
                  </th>
                  <SteamSortableHeader sortKey="default" sortState={sortState} onSort={handleSort}>
                    {T.gameInfoTable.headerAchievement}
                  </SteamSortableHeader>
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
              <tbody className="enter-rows">
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
          <ul className="sm:hidden w-full flex flex-col gap-2 enter-rows">
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

          {(folded || (showAll && filtered.length > FIRST_ROWS && !query.trim())) && (
            <ShowRestButton folded={folded} rest={filtered.length - FIRST_ROWS} onToggle={() => setShowAll((v) => !v)} />
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
    </div>
  )
}
