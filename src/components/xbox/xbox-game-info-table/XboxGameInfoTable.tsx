'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
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
import GameInfoTableFoldBar from '@/components/game-info-table-fold-bar/GameInfoTableFoldBar'
import AchievementDetailModal from '@/components/achievement-detail-modal/AchievementDetailModal'
import type { XboxAchievement } from '@/types/xbox'
import { tabClass, TAB_ROW } from '@/components/ui/Tabs'

type Filter = 'all' | 'earned' | 'unearned'

const COLLAPSED_ROWS = 3
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
  const [expanded, setExpanded] = useState(true)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [selected, setSelected] = useState<XboxAchievement | null>(null)
  const { isRevealed, toggle: toggleOne, setAll } = useRevealedAchievements()

  const FILTER_LABELS: Record<Filter, string> = {
    all: T.gameInfoTable.filterAll,
    earned: T.gameInfoTable.filterEarned,
    unearned: T.gameInfoTable.filterUnearned,
  }

  // Deep link from an achievement: show it (state, so while rendering), then scroll
  // to the visible copy (row on desktop, card on phones) and light it up for a moment.
  const hash = useLocationHash()
  const linkedId = hash.startsWith(ANCHOR) ? hash.slice(ANCHOR.length) : null
  const linked = linkedId !== null && achievements.some((a) => a.id === linkedId)

  useWhenChanged([linked ? linkedId : null, achievements], () => {
    if (!linked) return
    setFilter('all')
    setExpanded(true)
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
    const list =
      filter === 'earned' ? achievements.filter((a) => a.unlocked) : filter === 'unearned' ? achievements.filter((a) => !a.unlocked) : achievements
    const sorted = sortAchievements(list, sortState)
    // Pinned first, each part in the chosen order — as RA's table does.
    return canPin ? [...sorted.filter((a) => leading.has(a.id)), ...sorted.filter((a) => !leading.has(a.id))] : sorted
  }, [achievements, filter, sortState, canPin, leading])

  function handleSort(key: SteamSortKey) {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: STEAM_DEFAULT_DIRS[key] },
    )
  }

  const secrets = achievements.filter((a) => a.secret && !a.unlocked)
  const allRevealed = secrets.length > 0 && secrets.every((a) => isRevealed(a.id))
  const needsToggle = filtered.length > COLLAPSED_ROWS
  const shown = expanded || !needsToggle ? filtered : filtered.slice(0, COLLAPSED_ROWS)

  return (
    <section className="bg-bg-card p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5 mb-5">
      <div className={TAB_ROW} role="group" aria-label={T.xbox.achievements}>
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
        {secrets.length > 0 && (
          <button
            onClick={() => setAll(secrets.map((a) => a.id), !allRevealed)}
            aria-pressed={allRevealed}
            className="px-3 py-1 rounded-full text-xs font-medium bg-bg-card/60 text-text-secondary hover:text-text-main hover:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {allRevealed ? T.xbox.hideSecretAchievements : T.xbox.showSecretAchievements}
          </button>
        )}
      </div>

      {needsToggle && (
        <GameInfoTableFoldBar expanded={expanded} onToggle={() => setExpanded((e) => !e)} shown={filtered.length} total={achievements.length} />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-text-secondary self-center py-4">{T.xbox.noAchievements}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div id={panelId} className="hidden sm:block w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-sm border-b border-bg-header">
                  <th className="px-3 py-2 w-24 text-center text-text-secondary">{T.gameInfoTable.headerIcon}</th>
                  <SteamSortableHeader sortKey="default" sortState={sortState} onSort={handleSort} className="text-left">
                    {T.xbox.achievement}
                  </SteamSortableHeader>
                  <th className="px-3 py-2 w-28 text-center text-text-secondary">{T.xbox.score}</th>
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
          <ul className="sm:hidden w-full flex flex-col gap-2">
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
  )
}
