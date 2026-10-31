import LibraryExplorerSkeleton from '@/components/library-explorer-skeleton/LibraryExplorerSkeleton'
import StatusPageSkeleton from '@/components/status-page-skeleton/StatusPageSkeleton'

// The page opens on the layout the person left. All three go in the HTML and
// `data-library-layout` on <html> shows that one, before React can read the choice.
export default function CategoryLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <div className="if-library-shelves"><LibraryExplorerSkeleton layout="shelves" /></div>
        <div className="if-library-list"><LibraryExplorerSkeleton layout="list" /></div>
        <div className="if-library-cards"><StatusPageSkeleton /></div>
      </div>
    </div>
  )
}
