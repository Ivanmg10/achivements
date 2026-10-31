import { Skeleton } from '@/components/ui/Skeleton'
import { SkeletonRow } from '@/components/ui/SkeletonList'
import MainPageProfileGameSkeleton from '../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'

const STATS = 4
const ROWS = 3

/**
 * A profile card while it loads, block for block like the real ones (header,
 * four stats, last game, recent unlocks) and filling the column the same way,
 * so switching platforms shows the shape of what is coming, not a cut-off box.
 */
export default function MainPageProfileSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="relative flex flex-col gap-3 p-3 bg-bg-card rounded-tile w-full h-full min-h-[647px] lg:min-h-[667px]">
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton radius="tile" className="absolute top-3 right-3 w-24 h-7" />
        <div className="flex gap-3 items-center pr-28">
          <Skeleton radius="tile" className="m-1 shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: STATS }).map((_, i) => (
            <div key={i} className="bg-bg-main rounded-tile px-3 py-2.5 flex flex-col gap-1">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-7 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      <MainPageProfileGameSkeleton />
      <div aria-hidden="true" className="bg-bg-main rounded-tile p-3 flex flex-col gap-1 flex-1">
        <Skeleton className="h-4 w-28 mb-1.5" />
        {Array.from({ length: ROWS }).map((_, i) => (
          <SkeletonRow key={i} className="gap-3 py-1.5" />
        ))}
      </div>
    </div>
  )
}
