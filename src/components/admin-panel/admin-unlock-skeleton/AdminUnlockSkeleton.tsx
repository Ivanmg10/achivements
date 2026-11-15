import { Skeleton } from '@/components/ui/Skeleton'

/**
 * The unlock step before the panel knows whether it is locked (the usual case): the line, the
 * password field and the button on the boxes of `AdminUnlock`, so the dialog does not change
 * size when the answer comes (#132).
 */
export default function AdminUnlockSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col gap-1.5 text-sm leading-5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton radius="field" className="h-(--h-field) w-full" />
      </div>
      <Skeleton radius="button" className="h-(--h-control) w-24 self-end" />
    </div>
  )
}
