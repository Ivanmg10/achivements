import MainPageSkeleton from '@/components/main-page/main-page-skeleton/MainPageSkeleton'

/** The home while its page arrives: the page's own layout, empty. */
export default function HomeLoading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-bg-main text-text-main">
      <MainPageSkeleton />
    </div>
  )
}
