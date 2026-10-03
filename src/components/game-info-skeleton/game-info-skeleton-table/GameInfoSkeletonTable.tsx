const ROWS = 6

/**
 * The achievement table while it loads: rows shaped like the real ones
 * (badge, title and description, the numbers on the right), so the page
 * keeps its shape when they fill. Decoration only.
 */
export default function GameInfoSkeletonTable({ rows = ROWS }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="bg-bg-card p-3 sm:p-5 rounded-xl w-[95%] mt-5 mb-5 flex flex-col gap-1 animate-pulse motion-reduce:animate-none">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3 rounded-xl">
          <div className="w-16 h-16 rounded-xl bg-white/[0.07] shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-4 w-1/3 rounded-full bg-white/[0.08]" />
            <div className="h-3 w-2/3 rounded-full bg-white/[0.05]" />
            <div className="h-2.5 w-1/4 rounded-full bg-white/[0.04]" />
          </div>
          <div className="hidden md:flex items-center gap-10 shrink-0">
            {[0, 1, 2, 3].map((c) => (
              <div key={c} className="h-3 w-12 rounded-full bg-white/[0.05]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
