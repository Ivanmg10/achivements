import { Skeleton } from '@/components/ui/Skeleton'

/**
 * The "last played" block of a profile while its game loads — the same size
 * as the real one, so the column does not jump when it arrives.
 */
export default function MainPageProfileGameSkeleton() {
  return (
    <div aria-hidden="true" className="bg-bg-main rounded-tile p-3 flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <div className="flex gap-3 items-center">
        <Skeleton radius="tile" className="w-12.5 h-12.5 shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-2" />
    </div>
  )
}
