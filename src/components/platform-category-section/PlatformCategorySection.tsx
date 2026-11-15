'use client'

import { Fragment, useMemo, type ReactNode } from 'react'
import { titleMatches } from '@/utils/gameCandidates'
import { matchesQuick, type Progress, type QuickFilter } from '@/utils/libraryInsights'
import type { PreviewGame } from '@/utils/sectionPreview'
import CollapsibleSection from '@/components/collapsible-section/CollapsibleSection'
import CollapsibleSectionPreview from '@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview'
import EmptyState from '@/components/empty-state/EmptyState'
import { PLATFORM_LOGO } from '@/components/game-card-platform-tag/GameCardPlatformTag'
import { STATUS_GRID_COLS } from '@/components/status-grid-control/statusGridCols'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { GameCardSkeleton } from '@/components/ui/GameCardSkeleton'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { useLanguage } from '@/context/LanguageContext'

const SKELETON_CARDS = 4

/** The colour of each platform's logo in its section's head: a platform hue, with Xbox's the theme's success. */
const LOGO_HUE = { steam: 'text-steam', psn: 'text-psn', xbox: 'text-success' }

/** What a platform tells its category section: its games and how they load, how to count and show them, and its words. */
export type PlatformCategorySectionProps<T extends { id: number; title: string }> = {
  source: keyof typeof LOGO_HUE
  category: string
  gridCols?: StatusGridCols
  /** The section's heading, which a page that shows several categories at once may override. */
  title: string
  /** Root classes: lets a page card the section without an empty card when unlinked. */
  className?: string
  /** Title filter shared with the other lists, from the page's search box. */
  query?: string
  /** The page's quick filter (almost done, stalled). */
  quick?: QuickFilter
  /** The folded preview's size, decided by the page so all sections fill the screen together. */
  preview?: { columns: number; count: number }
  /** The platform's library of this category, as its hook answers. */
  data: { games: T[]; isLinked: boolean; loading: boolean; error: string | null; refetch: () => void }
  /** A game's progress, for the quick filter. */
  progressOf: (game: T) => Progress
  /** The teaser shown while the section is folded. */
  previewOf: (games: T[]) => PreviewGame[]
  renderItem: (game: T) => ReactNode
  texts: { error: string; /** Why, when the platform can say (a private profile). */ errorHint?: string; retry: string; empty: string }
  /** A line above the list, once it has loaded (Steam's partial progress). */
  note?: ReactNode
}

/**
 * The games of one category from one platform (Steam, PSN, Xbox), as their own foldable section beside
 * RA's list: a folded preview, then a skeleton, the failure with its retry, an empty state or the cards.
 * It lands whole: the skeleton holds until the library is in. Renders nothing without the platform linked.
 */
export default function PlatformCategorySection<T extends { id: number; title: string }>({
  source,
  category,
  gridCols = 2,
  title,
  className,
  query = '',
  quick = 'all',
  preview = { columns: 3, count: 3 },
  data,
  progressOf,
  previewOf,
  renderItem,
  texts,
  note,
}: PlatformCategorySectionProps<T>) {
  const { T } = useLanguage()
  const { games: allGames, isLinked, loading, error, refetch } = data
  const games = useMemo(() => allGames.filter((g) => titleMatches(g.title, query) && matchesQuick(progressOf(g), quick)), [allGames, query, quick, progressOf])
  const Logo = PLATFORM_LOGO[source]

  if (!isLinked) return null

  return (
    <CollapsibleSection
      title={title}
      icon={<Logo size={22} className={LOGO_HUE[source]} aria-hidden="true" />}
      count={loading || error ? undefined : games.length}
      storageKey={`${source}-section-open:${category}`}
      className={className}
      preview={error ? null : <CollapsibleSectionPreview games={previewOf(games)} loading={loading} columns={preview.columns} count={preview.count} />}
    >
      {!loading && !error && note}

      {loading ? (
        <div aria-busy="true" className={`grid gap-3 items-start w-full ${STATUS_GRID_COLS[gridCols]}`}>
          {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorRetry message={texts.error} hint={texts.errorHint} retryLabel={texts.retry} onRetry={refetch} />
      ) : games.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<Logo size={24} aria-hidden="true" />}
          title={query || quick !== 'all' ? T.search.noResults : texts.empty}
          className="py-6"
        />
      ) : (
        <div className={`grid gap-3 items-start w-full enter-cards ${STATUS_GRID_COLS[gridCols]}`}>
          {games.map((g) => (
            <Fragment key={g.id}>{renderItem(g)}</Fragment>
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}
