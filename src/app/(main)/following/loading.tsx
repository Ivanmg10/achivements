import FollowingPageSkeleton from '@/components/following-page/following-page-skeleton/FollowingPageSkeleton'

export default function FollowingLoading() {
  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-44 rounded-3xl bg-bg-card animate-pulse motion-reduce:animate-none lg:col-span-2" />
          <div className="h-44 rounded-3xl bg-bg-card animate-pulse motion-reduce:animate-none" />
        </div>
        <FollowingPageSkeleton />
      </div>
    </div>
  )
}
