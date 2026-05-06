export function GameCardSkeleton() {
  return (
    <div className="flex flex-row items-center justify-between p-2 mx-2 my-1 bg-bg-main rounded-xl w-[95%] animate-pulse">
      <div className="flex flex-row items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-white/10 shrink-0" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 rounded bg-white/10" />
          <div className="h-2.5 w-20 rounded bg-white/10" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0 pr-1">
        <div className="h-3 w-8 rounded bg-white/10" />
        <div className="h-2.5 w-12 rounded bg-white/10" />
      </div>
    </div>
  )
}
