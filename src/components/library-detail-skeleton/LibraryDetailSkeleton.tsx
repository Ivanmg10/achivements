import { Skeleton } from '@/components/ui/Skeleton'

/**
 * What a game's detail has under its ring while it loads: the row of figures
 * and the panels of its own (calendar and list, milestones, the hardest ones),
 * as empty blocks of the height they will have. The detail takes its place
 * without anything below it jumping. Decorative: the detail says it is loading.
 * It sits in the detail's grid, so it takes the same columns.
 */
export default function LibraryDetailSkeleton() {
  return (
    <>
      {/* The row of figures: bare figures sharing the width, 65 px tall (a label and a figure). */}
      <div aria-hidden="true" className="@3xl:col-span-3 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} radius="tile" className="h-[4.0625rem]" />
        ))}
      </div>
      <Skeleton radius="tile" className="h-72 @3xl:col-span-2" />
      <Skeleton radius="tile" className="h-72" />
    </>
  )
}
