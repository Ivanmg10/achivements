import StatusPageSkeleton from '@/components/status-page-skeleton/StatusPageSkeleton'

export default function CategoryConsoleLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-3">
        <StatusPageSkeleton />
      </div>
    </div>
  )
}
