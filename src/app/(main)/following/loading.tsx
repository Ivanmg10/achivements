import { Skeleton } from '@/components/ui/Skeleton'
import FollowingHero from '@/components/following-page/following-hero/FollowingHero'
import FollowingPageSkeleton from '@/components/following-page/following-page-skeleton/FollowingPageSkeleton'

export default function FollowingLoading() {
  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FollowingHero users={[]} isLoading className="lg:col-span-2" />
          <Skeleton radius="card" className="h-[280px]" />
        </div>
        <FollowingPageSkeleton />
      </div>
    </div>
  )
}
