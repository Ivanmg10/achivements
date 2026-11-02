import { SURFACE } from '@/components/ui/surface'
import { Skeleton } from '@/components/ui/Skeleton'
import { SkeletonRow } from '@/components/ui/SkeletonList'

/** The cover's hero while the game played last is read, in the same box, so the page below it does not move. */
export default function MainPagePortadaSkeleton() {
  return (
    <section aria-hidden="true" className="home-cover relative mx-3 mt-3 rounded-card overflow-hidden ring-1 ring-ink/[0.08] bg-bg-card min-h-64 sm:min-h-[23.75rem] flex">
      <div className="relative flex flex-col gap-3 p-6 sm:p-12 w-full max-w-3xl justify-center">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton radius="tile" className="h-12 sm:h-[4.75rem] w-4/5" />
        <Skeleton radius="tag" className="h-6 w-28" />
        <div className="flex items-center gap-3.5 max-w-lg mt-2">
          <Skeleton className="h-2 flex-1" />
          <Skeleton className="h-6 w-20 shrink-0" />
        </div>
        <Skeleton className="h-5 w-72 max-w-full" />
        <Skeleton radius="button" className="h-11 w-36 mt-5" />
      </div>
    </section>
  )
}

/** Your level beside the cover: the ring, the tier and points, the week's bars. */
export function PortadaLevelSkeleton() {
  return (
    <div aria-hidden="true" className={`${SURFACE} p-5 sm:px-6 flex flex-col gap-4 min-h-[249px]`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
        <Skeleton radius="circle" className="w-28 h-28" />
        <div className="flex flex-col gap-2 min-w-0">
          <Skeleton radius="tag" className="h-6 w-24" />
          <Skeleton className="h-7 w-32 max-w-full" />
          <Skeleton className="h-3.5 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-ink/10 pt-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-end gap-4">
          <Skeleton className="h-7 w-16 shrink-0" />
          <Skeleton radius="tag" className="h-10 flex-1" />
        </div>
      </div>
    </div>
  )
}

/** Your streak beside the cover: how long, and the last weeks as bars. */
export function PortadaStreakSkeleton() {
  return (
    <div aria-hidden="true" className={`${SURFACE} p-5 flex flex-col gap-3 min-h-[132px]`}>
      <Skeleton className="h-6 w-32" />
      <Skeleton radius="tag" className="h-6" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
  )
}

/** The cover's column while nothing is read yet: level, streak and the last achievements. */
export function PortadaSideSkeleton() {
  return (
    <div aria-hidden="true" className="m-3 flex flex-col gap-4 flex-1 min-h-0">
      <PortadaLevelSkeleton />
      <PortadaStreakSkeleton />
      <div className={`${SURFACE} p-4 flex flex-col gap-1 flex-1 min-h-[284px]`}>
        <Skeleton className="h-5 w-40 mb-1.5" />
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} className="gap-3 py-1.5" />
        ))}
      </div>
    </div>
  )
}
