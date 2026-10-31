import { Skeleton } from '@/components/ui/Skeleton'

const SHELF = 5

/** The trophy shelf while it loads: its title and counts, then the covers on their tiles. */
export default function CollectionShelfSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div aria-hidden="true" className="flex items-center justify-between gap-3 flex-wrap">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div aria-hidden="true" className="grid grid-flow-col auto-cols-[minmax(8.5rem,1fr)] gap-3 overflow-hidden">
        {Array.from({ length: SHELF }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 rounded-tile bg-bg-main ring-1 ring-ink/[0.04] p-3">
            <Skeleton radius="tag" className="h-28 sm:h-32 w-full" />
            <div className="flex flex-col items-center gap-1 w-full">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
