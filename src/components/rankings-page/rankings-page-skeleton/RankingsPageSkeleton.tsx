/** The rankings while they load: the podium's three steps and a few rows, in the page's own shapes. */
export default function RankingsPageSkeleton({ podium = true }: { podium?: boolean }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 animate-pulse motion-reduce:animate-none">
      {podium && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {['h-40', 'h-48', 'h-36'].map((h) => (
            <div key={h} className={`${h} rounded-card bg-bg-card`} />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-14 rounded-tile bg-bg-card" />
        ))}
      </div>
    </div>
  )
}
