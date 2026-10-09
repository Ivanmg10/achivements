/**
 * The "last played" block of a profile while its game loads — the same size
 * as the real one, so the column does not jump when it arrives.
 */
export default function MainPageProfileGameSkeleton() {
  return (
    <div aria-hidden="true" className="bg-bg-main rounded-lg p-3 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-24 bg-ink/10 rounded" />
      <div className="flex gap-3 items-center">
        <div className="w-12.5 h-12.5 rounded-lg bg-ink/10 shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3.5 bg-ink/10 rounded w-3/4" />
          <div className="h-3 bg-ink/10 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-ink/10 rounded w-1/4" />
      <div className="h-2 bg-ink/10 rounded" />
    </div>
  )
}
