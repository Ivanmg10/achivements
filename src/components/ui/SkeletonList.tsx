export function SkeletonGameList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-2 bg-bg-main rounded-lg p-2">
          <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
          <div className="flex flex-col flex-1 gap-1.5">
            <div className="h-2.5 w-24 rounded bg-white/10" />
            <div className="h-2 w-16 rounded bg-white/10" />
          </div>
          <div className="h-3 w-8 rounded bg-white/10 shrink-0" />
        </div>
      ))}
    </div>
  )
}
