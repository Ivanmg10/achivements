'use client'

import { useLibraryPrefs } from '@/hooks/useLibraryPrefs'
import LibraryExplorerSkeleton from '@/components/library-explorer-skeleton/LibraryExplorerSkeleton'
import StatusPageSkeleton from '@/components/status-page-skeleton/StatusPageSkeleton'

// The page opens on the layout the person left, so that is the shape that lands.
export default function CategoryLoading() {
  const { layout } = useLibraryPrefs('')

  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        {layout === 'cards' ? <StatusPageSkeleton /> : <LibraryExplorerSkeleton layout={layout === 'list' ? 'list' : 'shelves'} />}
      </div>
    </div>
  )
}
