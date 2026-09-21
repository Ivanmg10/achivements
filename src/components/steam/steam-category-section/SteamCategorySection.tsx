'use client'

import { IconBrandSteam } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import CollapsibleSection from '@/components/collapsible-section/CollapsibleSection'
import SteamStatusGameList from '@/components/steam/steam-status-game-list/SteamStatusGameList'
import EmptyState from '@/components/empty-state/EmptyState'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

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
}: {
  category: string
  gridCols?: StatusGridCols
  /** Heading override, for pages that show several categories at once. */
  title?: string
  /** Root classes — lets a page card the section without an empty card when unlinked. */
  className?: string
}) {
  const { T } = useLanguage()
  const { games, isLinked, loading, error, progressTruncated, refetch } = useSteamGamesByCategory(category)

  if (!isLinked) return null

  return (
    <CollapsibleSection
      title={title ?? T.steam.gamesSection}
      icon={<IconBrandSteam size={22} className="text-[#66c0f4]" aria-hidden="true" />}
      count={loading || error ? undefined : games.length}
      storageKey={`steam-section-open:${category}`}
      className={className}
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
          icon={<IconBrandSteam className="w-6 h-6" />}
          title={T.steam.noGamesInCategory}
          className="py-6"
        />
      ) : (
        <SteamStatusGameList games={games} gridCols={gridCols} />
      )}
    </CollapsibleSection>
  )
}
