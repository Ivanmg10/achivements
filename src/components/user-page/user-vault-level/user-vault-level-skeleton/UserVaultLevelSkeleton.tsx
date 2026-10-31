import { Skeleton } from '@/components/ui/Skeleton'

/** The level's box while it is read: its lines at their real heights, so what is below does not move when it lands. */
export default function UserVaultLevelSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 rounded-pane bg-bg-main p-4">
      <span className="flex items-center justify-between gap-2 text-lg">
        <Skeleton className="h-[1lh] w-28 max-w-[45%]" />
        <Skeleton className="h-[1lh] w-40 max-w-[45%]" />
      </span>
      <Skeleton className="h-1.5 w-full" />
      <Skeleton className="h-[1lh] w-36 text-[0.8125rem]" />
    </div>
  )
}
