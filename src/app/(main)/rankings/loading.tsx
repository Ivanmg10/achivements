import RankingsPageSkeleton from '@/components/rankings-page/rankings-page-skeleton/RankingsPageSkeleton'

export default function RankingsLoading() {
  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <div aria-hidden="true" className="h-16 w-64 rounded-card bg-bg-card animate-pulse motion-reduce:animate-none" />
        <RankingsPageSkeleton />
      </div>
    </div>
  )
}
