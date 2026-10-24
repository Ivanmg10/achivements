const ROWS = 6

/**
 * The achievement table while it loads: rows shaped like the real ones
 * (badge, title and description, the numbers on the right), so the page
 * keeps its shape when they fill. Decoration only.
 */
export default function GameInfoSkeletonTable({ rows = ROWS }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="w-full px-4 sm:px-8 lg:px-14 mt-7 mb-7">
    <div className="bg-bg-card rounded-card ring-1 ring-ink/[0.06] p-4 sm:p-6 flex flex-col gap-1 animate-pulse motion-reduce:animate-none">
      <div className="flex gap-4 h-11 items-end pb-2 mb-2 shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]">
        {[14, 18, 20].map((w, i) => (
          <div key={i} className="h-3.5 rounded-full bg-ink/[0.07]" style={{ width: `${w * 0.25}rem` }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-2.5 shadow-[inset_0_-1px_0_rgb(var(--ink)/0.05)]">
          <div className="w-[3.25rem] h-[3.25rem] rounded-[0.625rem] bg-ink/[0.07] shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-4 w-1/3 rounded-full bg-ink/[0.08]" />
            <div className="h-3 w-2/3 rounded-full bg-ink/[0.05]" />
            <div className="h-2.5 w-1/4 rounded-full bg-ink/[0.04]" />
          </div>
          <div className="hidden md:flex items-center gap-10 shrink-0">
            {[0, 1, 2, 3].map((c) => (
              <div key={c} className="h-3 w-12 rounded-full bg-ink/[0.05]" />
            ))}
          </div>
        </div>
      ))}
    </div>
    </div>
  )
}
