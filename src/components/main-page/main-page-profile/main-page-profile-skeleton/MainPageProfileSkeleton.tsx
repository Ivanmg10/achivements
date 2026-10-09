import MainPageProfileGameSkeleton from '../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'

const STATS = 4
const ROWS = 3

/**
 * A profile card while it loads, block for block like the real ones (header,
 * four stats, last game, recent unlocks) and filling the column the same way,
 * so switching platforms shows the shape of what is coming, not a cut-off box.
 */
export default function MainPageProfileSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="relative flex flex-col gap-3 p-3 bg-bg-card rounded-xl w-full h-full">
      <div aria-hidden="true" className="flex flex-col gap-3 animate-pulse">
        <div className="absolute top-3 right-3 w-24 h-7 rounded-lg bg-ink/8" />
        <div className="flex gap-3 items-center pr-28">
          <div className="m-1 rounded-lg bg-ink/10 shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-6 bg-ink/10 rounded w-2/3" />
            <div className="h-3 bg-ink/10 rounded w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: STATS }).map((_, i) => (
            <div key={i} className="bg-bg-main rounded-lg p-3 flex flex-col gap-2">
              <div className="h-6 bg-ink/10 rounded w-1/2" />
              <div className="h-3 bg-ink/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
      <MainPageProfileGameSkeleton />
      <div aria-hidden="true" className="bg-bg-main rounded-lg p-3 flex flex-col gap-2 flex-1 animate-pulse">
        <div className="h-3 w-28 bg-ink/10 rounded" />
        {Array.from({ length: ROWS }).map((_, i) => (
          <div key={i} className="flex gap-2 items-center p-1">
            <div className="w-9 h-9 rounded bg-ink/10 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="h-2.5 bg-ink/10 rounded w-3/4" />
              <div className="h-2 bg-ink/10 rounded w-1/2" />
            </div>
            <div className="w-8 h-3 bg-ink/10 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
