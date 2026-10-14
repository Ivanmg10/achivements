import LibraryExplorerSkeleton from '@/components/library-explorer-skeleton/LibraryExplorerSkeleton'

// The page opens on its shelves, so that is the shape that lands.
export default function CategoryLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-3">
        <LibraryExplorerSkeleton layout="shelves" />
      </div>
    </div>
  )
}
