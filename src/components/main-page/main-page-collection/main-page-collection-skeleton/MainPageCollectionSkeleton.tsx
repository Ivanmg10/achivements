import { Skeleton } from '@/components/ui/Skeleton'
import { SkeletonRow } from '@/components/ui/SkeletonList'
import CollectionShelfSkeleton from '../collection-shelf-skeleton/CollectionShelfSkeleton'

const CARD = 'bg-bg-card rounded-tile p-4 flex flex-col gap-3'
const TILES = 36

/** The Collection section while it loads, card for card: the shelf, the numbers, the grid and what is closest. */
export default function MainPageCollectionSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className={CARD}>
        <CollectionShelfSkeleton />
      </div>
      <div className={`${CARD} 2xl:min-h-[185px]`}>
        <div aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-tile bg-bg-main p-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={`${CARD} xl:col-span-2`}>
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
            {Array.from({ length: TILES }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-1">
                <Skeleton radius="tile" className="w-14 h-14" />
                <Skeleton className="h-2.5 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className={CARD}>
          <Skeleton className="h-3 w-32" />
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} icon="w-7 h-7" figure className="bg-bg-main rounded-tile p-2" />
          ))}
        </div>
      </div>
    </div>
  )
}
