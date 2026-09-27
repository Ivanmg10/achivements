'use client'

import { useMemo } from 'react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { titleMatches } from '@/utils/gameCandidates'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import CollapsibleSection from '@/components/collapsible-section/CollapsibleSection'
import CollapsibleSectionPreview from '@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview'
import SteamStatusGameList from '@/components/steam/steam-status-game-list/SteamStatusGameList'
import EmptyState from '@/components/empty-state/EmptyState'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { steamPreviewGames } from '@/utils/sectionPreview'

const SKELETON_CARDS = 4

/** Skeleton only — the real list uses the masonry layout. */
const GRID_CLASS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

/**
 * The Steam games belonging to one category, as their own foldable section
 * under the RA list rather than mixed into it: the RA list's filtering,
 * sorting and console pills are all built on RA fields Steam games do not
 * have. Cards and layout match the RA list. Renders nothing for users
 * without Steam linked.
 */
export default function SteamCategorySection({
  category,
  gridCols = 2,
  title,
  className = '',
  query = '',
}: {
  category: string
  gridCols?: StatusGridCols
  /** Heading override, for pages that show several categories at once. */
  title?: string
  /** Root classes — lets a page card the section without an empty card when unlinked. */
  className?: string
  /** Title filter shared with the RA list, from the page's search box. */
  query?: string
}) {
  const { T } = useLanguage()
  const { games: allGames, isLinked, loading, error, progressTruncated, refetch } = useSteamGamesByCategory(category)
  const games = useMemo(() => allGames.filter((g) => titleMatches(g.title, query)), [allGames, query])

  if (!isLinked) return null

  return (
    <CollapsibleSection
      title={title ?? T.steam.gamesSection}
      icon={<SteamLogo size={22} className="text-[#66c0f4]" aria-hidden="true" />}
      count={loading || error ? undefined : games.length}
      storageKey={`steam-section-open:${category}`}
      className={className}
      preview={error ? null : <CollapsibleSectionPreview games={steamPreviewGames(games)} loading={loading} />}
    >
      {progressTruncated && category !== 'wantToPlay' && !loading && !error && (
        <p className="text-xs text-text-secondary">{T.steam.partialProgressNote}</p>
      )}

      {loading ? (
        <div aria-busy="true" className={`grid gap-3 ${GRID_CLASS[gridCols]}`}>
          {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
            <div key={i} className="h-36 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">
            {T.steam.gamesError}
          </p>
          <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
          <button
            onClick={refetch}
            className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
          >
            {T.steam.retry}
          </button>
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<SteamLogo className="w-6 h-6" />}
          title={query ? T.search.noResults : T.steam.noGamesInCategory}
          className="py-6"
        />
      ) : (
        <SteamStatusGameList games={games} gridCols={gridCols} />
      )}
    </CollapsibleSection>
  )
}
