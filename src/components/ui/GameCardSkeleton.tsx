import { Skeleton } from './Skeleton'

/** A status list's game card while it loads: cover, title, chip and counts, in the real card's box. */
export function GameCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-bg-card rounded-card ring-1 ring-ink/5 p-4 sm:p-5 flex items-start gap-3 sm:gap-5">
      <Skeleton radius="tile" className="w-16 h-16 sm:w-24 sm:h-24 shrink-0" />
      <div className="flex flex-col gap-2.5 flex-1 min-w-0 pt-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton radius="tag" className="h-4 w-24" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  )
}
