/**
 * The shape of a game row card while it loads: cover, title, progress bar and
 * the line under it, where the real card will put them, so nothing jumps when
 * it fills. Decoration only.
 */
export function GameRowSkeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`bg-bg-main rounded-2xl ring-1 ring-ink/[0.04] flex items-center gap-3 px-3 py-3 ${className}`}>
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-ink/[0.06] shrink-0" />
      <div className="flex flex-col flex-1 min-w-0 gap-2">
        <div className="h-3.5 w-2/5 rounded-full bg-ink/[0.08]" />
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-16 rounded-full bg-ink/[0.06]" />
          <div className="h-1.5 flex-1 rounded-full bg-ink/[0.06]" />
        </div>
        <div className="h-2.5 w-1/3 rounded-full bg-ink/[0.05]" />
      </div>
    </div>
  )
}
