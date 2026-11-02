import { Skeleton } from '@/components/ui/Skeleton'

const CARDS = 8

/** The admin panel's users while they load, in the shape of their cards. */
export default function AdminUsersSkeleton() {
  return (
    <div role="status" aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <span className="sr-only">Loading users...</span>
      {Array.from({ length: CARDS }, (_, i) => (
        <div key={i} aria-hidden="true" className="bg-bg-card rounded-card p-4 flex flex-col gap-3 ring-1 ring-ink/5">
          <div className="flex items-start gap-3">
            <Skeleton radius="circle" className="w-11 h-11 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-3 w-3/4" />
          <div className="flex gap-2">
            <Skeleton radius="button" className="h-8 flex-1" />
            <Skeleton radius="button" className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </div>
  )
}
