import FollowingPageSkeleton from '@/components/following-page/following-page-skeleton/FollowingPageSkeleton'

export default function FollowingLoading() {
  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <div aria-hidden="true" className="h-8 w-40 rounded-lg bg-bg-card animate-pulse motion-reduce:animate-none" />
        <div className="bg-bg-card rounded-2xl p-2">
          <FollowingPageSkeleton />
        </div>
      </div>
    </div>
  )
}
