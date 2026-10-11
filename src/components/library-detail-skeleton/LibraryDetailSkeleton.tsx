const BLOCK = 'rounded-xl bg-ink/[0.06]'

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
      <div aria-hidden="true" className="@3xl:col-span-3 flex flex-wrap gap-2">
        {[28, 32, 28, 36].map((w, i) => (
          <div key={i} className={`${BLOCK} h-14`} style={{ width: `${w * 0.25}rem` }} />
        ))}
      </div>
      <div aria-hidden="true" className={`${BLOCK} h-72 @3xl:col-span-2`} />
      <div aria-hidden="true" className={`${BLOCK} h-72`} />
    </>
  )
}
