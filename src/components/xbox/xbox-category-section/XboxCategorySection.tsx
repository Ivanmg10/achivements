'use client'

import { useMemo } from 'react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import { titleMatches } from '@/utils/gameCandidates'
import { xboxPreviewGames } from '@/utils/sectionPreview'
import { matchesQuick, xboxProgress, type QuickFilter } from '@/utils/libraryInsights'
import CollapsibleSection from '@/components/collapsible-section/CollapsibleSection'
import CollapsibleSectionPreview from '@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview'
import XboxStatusGameItem from '@/components/xbox/xbox-status-game-item/XboxStatusGameItem'
import EmptyState from '@/components/empty-state/EmptyState'
import { STATUS_GRID_COLS } from '@/components/statusGameList/StatusGameList'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { GameCardSkeleton } from '@/components/ui/GameCardSkeleton'

const SKELETON_CARDS = 4

/** Skeleton only. */
const GRID_CLASS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

/**
 * The Xbox games belonging to one category, as their own foldable section
 * beside RA, Steam and PSN — PsnCategorySection's counterpart, with the same
 * folded preview, cards and layout. Renders nothing without Xbox linked.
 */
export default function XboxCategorySection({
  category,
  gridCols = 2,
  query = '',
  quick = 'all',
  preview = { columns: 3, count: 3 },
}: {
  category: string
  gridCols?: StatusGridCols
  /** Title filter shared with the other lists, from the page's search box. */
  query?: string
  /** The page's quick filter (almost done, stalled). */
  quick?: QuickFilter
  /** The folded preview's size, decided by the page so all sections fill the screen together. */
  preview?: { columns: number; count: number }
}) {
  const { T } = useLanguage()
  const { games: allGames, isLinked, loading, error, refetch } = useXboxGamesByCategory(category)
  const games = useMemo(() => allGames.filter((g) => titleMatches(g.title, query) && matchesQuick(xboxProgress(g), quick)), [allGames, query, quick])

  if (!isLinked) return null

  return (
    <CollapsibleSection
      title={T.xbox.gamesSection}
      icon={<XboxLogo size={22} className="text-success" aria-hidden="true" />}
      count={loading || error ? undefined : games.length}
      storageKey={`xbox-section-open:${category}`}
      preview={
        error ? null : (
          <CollapsibleSectionPreview games={xboxPreviewGames(games)} loading={loading} columns={preview.columns} count={preview.count} />
        )
      }
    >
      {loading ? (
        <div aria-busy="true" className={`grid gap-3 ${GRID_CLASS[gridCols]}`}>
          {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-danger">
            {T.xbox.gamesError}
          </p>
          {error === 'private' && <p className="text-xs text-text-secondary">{T.xbox.errors.private}</p>}
          <button onClick={refetch} className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
            {T.xbox.retry}
          </button>
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<XboxLogo size={24} aria-hidden="true" />}
          title={query || quick !== 'all' ? T.search.noResults : T.xbox.noGamesInCategory}
          className="py-6"
        />
      ) : (
        <div className={`grid gap-3 items-start w-full enter-cards ${STATUS_GRID_COLS[gridCols]}`}>
          {games.map((g) => (
            <XboxStatusGameItem key={g.id} game={g} category={category} />
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}
