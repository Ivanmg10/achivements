'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { psnPreviewGames } from '@/utils/sectionPreview'
import { psnProgress, type QuickFilter } from '@/utils/libraryInsights'
import PlatformCategorySection from '@/components/platform-category-section/PlatformCategorySection'
import PsnStatusGameItem from '@/components/psn/psn-status-game-item/PsnStatusGameItem'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

/** The PSN games of one category, as the shared foldable section. Renders nothing without PSN linked. */
export default function PsnCategorySection({
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
  const data = usePsnGamesByCategory(category)

  return (
    <PlatformCategorySection
      source="psn"
      category={category}
      gridCols={gridCols}
      title={T.psn.gamesSection}
      query={query}
      quick={quick}
      preview={preview}
      data={data}
      progressOf={psnProgress}
      previewOf={psnPreviewGames}
      renderItem={(g) => <PsnStatusGameItem game={g} category={category} />}
      texts={{
        error: T.psn.gamesError,
        errorHint: data.error === 'private' ? T.psn.errors.private : undefined,
        retry: T.psn.retry,
        empty: T.psn.noGamesInCategory,
      }}
    />
  )
}
