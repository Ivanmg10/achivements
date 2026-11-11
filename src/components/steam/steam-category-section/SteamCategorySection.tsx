'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { steamPreviewGames } from '@/utils/sectionPreview'
import { steamProgress, type QuickFilter } from '@/utils/libraryInsights'
import PlatformCategorySection from '@/components/platform-category-section/PlatformCategorySection'
import SteamStatusGameItem from '@/components/steam/steam-status-game-item/SteamStatusGameItem'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

/**
 * The Steam games of one category, as the shared foldable section under the RA list rather than mixed
 * into it: the RA list's filtering, sorting and console pills are all built on RA fields Steam games do
 * not have. Steam's progress counts can stop short on a long library, and the section says so. Renders
 * nothing for users without Steam linked.
 */
export default function SteamCategorySection({
  category,
  gridCols,
  title,
  className,
  query,
  quick,
  preview,
}: {
  category: string
  gridCols?: StatusGridCols
  /** Heading override, for pages that show several categories at once. */
  title?: string
  /** Root classes: lets a page card the section without an empty card when unlinked. */
  className?: string
  /** Title filter shared with the RA list, from the page's search box. */
  query?: string
  /** The page's quick filter (almost done, stalled). */
  quick?: QuickFilter
  /** The folded preview's size, decided by the page so all sections fill the screen together. */
  preview?: { columns: number; count: number }
}) {
  const { T } = useLanguage()
  const data = useSteamGamesByCategory(category)

  return (
    <PlatformCategorySection
      source="steam"
      category={category}
      gridCols={gridCols}
      title={title ?? T.steam.gamesSection}
      className={className}
      query={query}
      quick={quick}
      preview={preview}
      data={data}
      progressOf={steamProgress}
      previewOf={steamPreviewGames}
      renderItem={(g) => <SteamStatusGameItem game={g} category={category} inSection />}
      texts={{ error: T.steam.gamesError, errorHint: T.steam.privateProfileHint, retry: T.steam.retry, empty: T.steam.noGamesInCategory }}
      note={data.progressTruncated && category !== 'wantToPlay' && <p className="text-xs text-text-secondary">{T.steam.partialProgressNote}</p>}
    />
  )
}
