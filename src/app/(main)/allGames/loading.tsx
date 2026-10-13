import NoMainHeader from '@/components/no-main-header/NoMainHeader'
import AllGamesSkeleton from '@/components/all-games-skeleton/AllGamesSkeleton'

export default function AllGamesLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <NoMainHeader />
        <AllGamesSkeleton />
      </div>
    </div>
  )
}
