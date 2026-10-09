'use client'

import { useMemo, useState } from 'react'
import { IconEdit } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { filterPerfects, groupPerfectsByYear, PerfectFilter, PerfectGame } from '@/utils/perfectGames'
import BrowseSearchChips from '@/components/main-page/main-page-browse/browse-search-chips/BrowseSearchChips'
import PerfectGamesOrderModal from '@/components/main-page/perfect-games-order-modal/PerfectGamesOrderModal'
import CollectionTile from '../collection-tile/CollectionTile'

type View = 'year' | 'order'

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-x-2 gap-y-3'

/**
 * Every game at 100%, as covers with their names. By default in the user's
 * own order, editable as before; "by year" groups them by the year each got
 * there, newest first, with the dates on show. Chips narrow it to RA
 * hardcore, RA softcore, Steam or PlayStation.
 */
export default function CollectionGrid({
  games,
  allGames,
  dates,
  order,
  onSaveOrder,
}: {
  /** In the user's saved order. */
  games: PerfectGame[]
  /** Unordered, as the reorder modal expects. */
  allGames: PerfectGame[]
  dates: Map<string, string>
  order: string[]
  onSaveOrder: (order: string[]) => Promise<void>
}) {
  const { T } = useLanguage()
  const [filter, setFilter] = useState<PerfectFilter>('all')
  const [view, setView] = useState<View>('order')
  const [editOpen, setEditOpen] = useState(false)

  const shown = useMemo(() => filterPerfects(games, filter), [games, filter])
  const groups = useMemo(() => groupPerfectsByYear(shown, dates), [shown, dates])
  const count = (f: PerfectFilter) => filterPerfects(games, f).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-text-main">
          {T.cards.sectionCollection} <span className="text-text-secondary font-normal tabular-nums">· {games.length}</span>
        </h3>
        <div className="flex items-center gap-2">
          <BrowseSearchChips<View>
            label={T.cards.collectionView}
            value={view}
            onChange={setView}
            options={[
              { value: 'year', label: T.cards.viewByYear },
              { value: 'order', label: T.cards.viewMyOrder },
            ]}
          />
          {view === 'order' && (
            <button
              onClick={() => setEditOpen(true)}
              aria-label={T.cards.reorderMasteredAria}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconEdit className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <BrowseSearchChips<PerfectFilter>
        label={T.cards.sectionCollection}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `${T.cards.filterAll} ${count('all')}` },
          { value: 'raHc', label: `${T.cards.filterRaHc} ${count('raHc')}` },
          { value: 'raSc', label: `${T.cards.filterRaSc} ${count('raSc')}` },
          { value: 'steam', label: `Steam ${count('steam')}` },
          { value: 'psn', label: `PlayStation ${count('psn')}` },
        ]}
      />

      {shown.length === 0 ? (
        <p className="text-xs text-text-secondary py-6 text-center">{T.cards.noMatches}</p>
      ) : view === 'order' ? (
        <ul className={GRID}>
          {shown.map((g) => (
            <li key={g.key}>
              <CollectionTile game={g} date={dates.get(g.key)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.year ?? 'undated'} className="flex flex-col gap-2">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                <span className="text-text-main">{group.year ?? T.cards.undated}</span>
                <span className="tabular-nums">· {group.games.length}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-ink/[0.06]" />
              </h4>
              <ul className={GRID}>
                {group.games.map((g) => (
                  <li key={g.key}>
                    <CollectionTile game={g} date={dates.get(g.key)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <PerfectGamesOrderModal isOpen={editOpen} onClose={() => setEditOpen(false)} games={allGames} order={order} onSaveOrder={onSaveOrder} />
    </div>
  )
}
