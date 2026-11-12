import { Skeleton } from '@/components/ui/Skeleton'
import { FOLD_BOX } from '../MainPageProfileFold'

/** The folded profile's line while the home loads (a phone only): picture, name, level, streak and the button, on its boxes. */
export default function MainPageProfileFoldSkeleton() {
  return (
    <div aria-hidden="true" className={FOLD_BOX}>
      <Skeleton radius="circle" className="w-10 h-10 shrink-0" />
      <div className="min-w-0 flex-1 flex flex-col items-start gap-1">
        <Skeleton className="h-6 w-28 max-w-full" />
        <span className="flex items-center gap-2 h-6">
          <Skeleton radius="tag" className="h-[1.375rem] w-14" />
          <Skeleton radius="tag" className="h-6 w-12" />
        </span>
      </div>
      <Skeleton radius="button" className="h-(--h-control-sm) w-24 shrink-0" />
    </div>
  )
}
