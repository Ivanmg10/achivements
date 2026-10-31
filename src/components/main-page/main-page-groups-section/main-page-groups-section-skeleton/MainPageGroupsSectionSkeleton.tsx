import { Skeleton } from '@/components/ui/Skeleton'
import { SkeletonRow } from '@/components/ui/SkeletonList'

const CARD = 'bg-bg-card rounded-tile p-4 flex flex-col gap-4'

/** The Groups section before the groups are in: one group in full on the left and the list on the right, so the feature does not push the list when it comes. */
export default function MainPageGroupsSectionSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      <div aria-hidden="true" className={`${CARD} xl:col-span-2 min-h-[576px] xl:min-h-[442px]`}>
        <div className="flex items-center gap-4 rounded-card bg-bg-main ring-1 ring-ink/5 p-4">
          <Skeleton radius="circle" className="w-16 h-16 shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} radius="tile" className="aspect-square" />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className={`${CARD} min-h-[442px]`}>
        <Skeleton className="h-3 w-24" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} icon="w-9 h-9" className="p-2 gap-2.5" />
          ))}
        </div>
      </div>
    </div>
  )
}
