'use client'

import { useMemo } from 'react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { titleMatches } from '@/utils/gameCandidates'
import { psnPreviewGames } from '@/utils/sectionPreview'
import CollapsibleSection from '@/components/collapsible-section/CollapsibleSection'
import CollapsibleSectionPreview from '@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview'
import PsnStatusGameItem from '@/components/psn/psn-status-game-item/PsnStatusGameItem'
import EmptyState from '@/components/empty-state/EmptyState'
import { STATUS_GRID_COLS } from '@/components/statusGameList/StatusGameList'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

const SKELETON_CARDS = 4

/** Skeleton only. */
const GRID_CLASS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

/**
 * The PSN games belonging to one category, as their own foldable section
 * beside RA and Steam — SteamCategorySection's counterpart, with the same
 * folded preview, cards and layout. Renders nothing without PSN linked.
 */
export default function PsnCategorySection({
  category,
  gridCols = 2,
  query = '',
  preview = { columns: 3, count: 3 },
}: {
  category: string
  gridCols?: StatusGridCols
  /** Title filter shared with the other lists, from the page's search box. */
  query?: string
  /** The folded preview's size, decided by the page so all sections fill the screen together. */
  preview?: { columns: number; count: number }
}) {
  const { T } = useLanguage()
  const { games: allGames, isLinked, loading, error, refetch } = usePsnGamesByCategory(category)
  const games = useMemo(() => allGames.filter((g) => titleMatches(g.title, query)), [allGames, query])

  if (!isLinked) return null

  return (
    <CollapsibleSection
      title={T.psn.gamesSection}
      icon={<PlaystationLogo size={22} className="text-[#0070d1]" aria-hidden="true" />}
      count={loading || error ? undefined : games.length}
      storageKey={`psn-section-open:${category}`}
      preview={
        error ? null : (
          <CollapsibleSectionPreview games={psnPreviewGames(games)} loading={loading} columns={preview.columns} count={preview.count} />
        )
      }
    >
      {loading ? (
        <div aria-busy="true" className={`grid gap-3 ${GRID_CLASS[gridCols]}`}>
          {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
            <div key={i} className="h-36 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">
            {T.psn.gamesError}
          </p>
          {error === 'private' && <p className="text-xs text-text-secondary">{T.psn.errors.private}</p>}
          <button onClick={refetch} className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
            {T.psn.retry}
          </button>
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<PlaystationLogo size={24} aria-hidden="true" />}
          title={query ? T.search.noResults : T.psn.noGamesInCategory}
          className="py-6"
        />
      ) : (
        <div className={`grid gap-3 items-start w-full ${STATUS_GRID_COLS[gridCols]}`}>
          {games.map((g) => (
            <PsnStatusGameItem key={g.id} game={g} />
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}
