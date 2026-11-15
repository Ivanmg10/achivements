'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import { xboxPreviewGames } from '@/utils/sectionPreview'
import { xboxProgress, type QuickFilter } from '@/utils/libraryInsights'
import PlatformCategorySection from '@/components/platform-category-section/PlatformCategorySection'
import XboxStatusGameItem from '@/components/xbox/xbox-status-game-item/XboxStatusGameItem'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

/** The Xbox games of one category, as the shared foldable section. Renders nothing without Xbox linked. */
export default function XboxCategorySection({
  category,
  gridCols,
  query,
  quick,
  preview,
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
  const data = useXboxGamesByCategory(category)

  return (
    <PlatformCategorySection
      source="xbox"
      category={category}
      gridCols={gridCols}
      title={T.xbox.gamesSection}
      query={query}
      quick={quick}
      preview={preview}
      data={data}
      progressOf={xboxProgress}
      previewOf={xboxPreviewGames}
      renderItem={(g) => <XboxStatusGameItem game={g} category={category} />}
      texts={{
        error: T.xbox.gamesError,
        errorHint: data.error === 'private' ? T.xbox.errors.private : undefined,
        retry: T.xbox.retry,
        empty: T.xbox.noGamesInCategory,
      }}
    />
  )
}
