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
import XboxGameInfoAchievement from './xbox-game-info-achievement/XboxGameInfoAchievement'
import XboxGameInfoAchievementCard from './xbox-game-info-achievement-card/XboxGameInfoAchievementCard'
import { useXboxFavoriteAchievements } from '@/hooks/useXboxFavoriteAchievements'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useRevealedAchievements } from '@/hooks/useRevealedAchievements'
import { useLocationHash } from '@/hooks/useLocationHash'
import { guideLinks } from '@/utils/guideLinks'
import AchievementDetailModal from '@/components/achievement-detail-modal/AchievementDetailModal'
import type { XboxAchievement } from '@/types/xbox'
import AchievementTableToolbar from '@/components/achievement-table-toolbar/AchievementTableToolbar'
import ShowRestButton from '@/components/show-rest-button/ShowRestButton'
import { SURFACE } from '@/components/ui/surface'
import { TABLE, TH } from '@/components/ui/dataTable'
import { buttonClass } from '@/components/ui/Button'

type Filter = 'all' | 'earned' | 'unearned'

/** Rows shown before "show the other N". */
const FIRST_ROWS = 8
const HIGHLIGHT_MS = 2500
const ANCHOR = '#achievement-'

/** Game order is the order Xbox sends them in (its ids are not always numbers, so they are not sorted). */
function sortAchievements(list: XboxAchievement[], { key, dir }: SteamSortState): XboxAchievement[] {
  const cmp = (a: XboxAchievement, b: XboxAchievement): number => {
    // Unknown rarity sorts after known, whichever way the column runs.
    if (key === 'rarity') return (a.rarity ?? Infinity) - (b.rarity ?? Infinity)
    if (key === 'earned') {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      return (a.unlockedAt ?? '').localeCompare(b.unlockedAt ?? '')
    }
    return 0
  }
  const sorted = [...list].sort(cmp)
  if (dir === 'desc') {
    // For "earned", newest first but locked ones still last.
    if (key === 'earned') {
      const earned = sorted.filter((a) => a.unlocked).reverse()
      return [...earned, ...sorted.filter((a) => !a.unlocked)]
    }
    return sorted.reverse()
  }
  return sorted
}

/**
 * An Xbox game's achievements as a table (a card list on phones), matching
 * PsnGameInfoTable: all/earned/unearned filter, sortable columns (game order,
 * rarity, when earned), and fold to the first rows. A gamerscore column sits
 * beside the name — it is what Xbox is about.
 *
 * Opening the page from an achievement link (…#achievement-<id>) scrolls to it
 * and highlights it briefly. Each achievement can be pinned to the main page,
 * and the ones pinned when it loaded lead the list; each opens in a detail window with links to
 * guides.
 */
export default function XboxGameInfoTable({
  achievements,
  gameId,
  gameTitle,
}: {
  achievements: XboxAchievement[]
  gameId: number
  gameTitle: string
}) {
  const { T } = useLanguage()
  const { pinned, leading, toggle, canPin } = useXboxFavoriteAchievements(gameId, gameTitle)
  const panelId = useId()
  const [filter, setFilter] = useState<Filter>('all')
  const [sortState, setSortState] = useState<SteamSortState>({ key: 'default', dir: 'asc' })
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [selected, setSelected] = useState<XboxAchievement | null>(null)
  const { isRevealed, toggle: toggleOne, setAll } = useRevealedAchievements()

  // Deep link from an achievement: show it (state, so while rendering), then scroll
  // to the visible copy (row on desktop, card on phones) and light it up for a moment.
  const hash = useLocationHash()
  const linkedId = hash.startsWith(ANCHOR) ? hash.slice(ANCHOR.length) : null
  const linked = linkedId !== null && achievements.some((a) => a.id === linkedId)

  useWhenChanged([linked ? linkedId : null, achievements], () => {
    if (!linked) return
    setFilter('all')
    setQuery('')
    setShowAll(true)
    setHighlighted(linkedId)
  })

  useEffect(() => {
    if (!linked) return
    const id = linkedId
    const target = [...document.querySelectorAll<HTMLElement>('[data-achievement]')].find(
      (el) => el.dataset.achievement === id && el.offsetParent !== null,
    )
    target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [linked, linkedId, achievements])

  const filtered = useMemo(() => {
    let list =
      filter === 'earned' ? achievements.filter((a) => a.unlocked) : filter === 'unearned' ? achievements.filter((a) => !a.unlocked) : achievements
    // Searched by what is shown: a secret one by its hidden label, not its text.
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((a) => (a.secret && !a.unlocked && !isRevealed(a.id) ? T.xbox.secretAchievement : `${a.name} ${a.description}`).toLowerCase().includes(q))
    const sorted = sortAchievements(list, sortState)
    // Pinned first, each part in the chosen order — as RA's table does.
    return canPin ? [...sorted.filter((a) => leading.has(a.id)), ...sorted.filter((a) => !leading.has(a.id))] : sorted
  }, [achievements, filter, query, sortState, canPin, leading, isRevealed, T.xbox.secretAchievement])

  function handleSort(key: SteamSortKey) {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: STEAM_DEFAULT_DIRS[key] },
    )
  }

  const secrets = achievements.filter((a) => a.secret && !a.unlocked)
  const allRevealed = secrets.length > 0 && secrets.every((a) => isRevealed(a.id))
  const folded = !showAll && !query.trim() && filtered.length > FIRST_ROWS
  const shown = folded ? filtered.slice(0, FIRST_ROWS) : filtered
  const earnedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="w-full px-4 sm:px-8 lg:px-14 mt-7 mb-7">
    <section aria-label={T.xbox.achievements} className={`${SURFACE} p-4 sm:p-6 flex flex-col gap-4`}>
      <AchievementTableToolbar<Filter, SteamSortKey>
        label={T.xbox.achievements}
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
        extra={
          secrets.length > 0 && (
            <button type="button" onClick={() => setAll(secrets.map((a) => a.id), !allRevealed)} aria-pressed={allRevealed} className={buttonClass('quiet', 'sm')}>
              {allRevealed ? T.xbox.hideSecretAchievements : T.xbox.showSecretAchievements}
            </button>
          )
        }
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-text-secondary self-center py-6">{query.trim() ? T.gameInfoTable.noMatches : T.xbox.noAchievements}</p>
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
                    {T.xbox.achievement}
                  </SteamSortableHeader>
                  <th scope="col" className={`${TH} text-right w-24`}>{T.xbox.score}</th>
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
                  <XboxGameInfoAchievement
                    key={a.id}
                    achievement={a}
                    highlighted={highlighted === a.id}
                    revealed={isRevealed(a.id)}
                    onToggleReveal={() => toggleOne(a.id)}
                    pinned={canPin ? pinned.has(a.id) : undefined}
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
              <XboxGameInfoAchievementCard
                key={a.id}
                achievement={a}
                highlighted={highlighted === a.id}
                revealed={isRevealed(a.id)}
                onToggleReveal={() => toggleOne(a.id)}
                pinned={canPin ? pinned.has(a.id) : undefined}
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
        {selected && (() => {
          const concealed = selected.secret && !selected.unlocked && !isRevealed(selected.id)
          return (
            <AchievementDetailModal
              key={selected.id}
              title={concealed ? T.xbox.secretAchievement : selected.name}
              description={concealed ? T.xbox.secretAchievementDesc : selected.description}
              iconUrl={concealed ? null : selected.iconUrl}
              earned={selected.unlocked}
              earnedAt={selected.unlockedAt}
              rarity={selected.rarity}
              tags={<span className="font-semibold text-success">{selected.gamerscore} G</span>}
              guides={concealed ? [] : guideLinks('xbox', { gameTitle, title: selected.name })}
              pinned={canPin ? pinned.has(selected.id) : undefined}
              onTogglePin={() => toggle(selected)}
              showcase={
                selected.unlocked && selected.unlockedAt
                  ? { source: 'xbox', gameId, achievementKey: selected.id, gameTitle, title: selected.name, description: selected.description || null, badge: selected.iconUrl, earnedAt: selected.unlockedAt }
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
