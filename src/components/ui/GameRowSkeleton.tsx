import { Skeleton } from './Skeleton'

/**
 * The shape of a game row card while it loads: cover, title, progress bar and
 * the line under it, where the real card will put them, so nothing jumps when
 * it fills. Decoration only.
 */
export function GameRowSkeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`bg-bg-main rounded-card ring-1 ring-ink/[0.04] flex items-center gap-3 px-3 py-3 ${className}`}>
      <Skeleton radius="tile" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
      <div className="flex flex-col flex-1 min-w-0 gap-2">
        <Skeleton className="h-3.5 w-2/5" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-1.5 flex-1" />
        </div>
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  )
}
