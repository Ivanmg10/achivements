import { Skeleton } from './Skeleton'

const BARS = [45, 70, 30, 90, 55, 20, 80]

/**
 * A chart while it loads: its bars and, if it has them, the labels under them.
 * The one shape for every stage of a lazy chart (the page's skeleton, its data,
 * the download of the plot), so moving between them shows no change. It fills
 * the height of its box. Decoration only.
 */
export function ChartSkeleton({ bars = BARS, labels = false }: { bars?: number[]; labels?: boolean }) {
  return (
    <div aria-hidden="true" className="h-full px-1 flex flex-col justify-end gap-1">
      <div className="flex items-end gap-2 flex-1 min-h-0">
        {bars.map((h, i) => (
          <Skeleton key={i} radius="tag" className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
      {labels && (
        <div className="flex gap-2">
          {bars.map((_, i) => (
            <Skeleton key={i} className="flex-1 h-3" />
          ))}
        </div>
      )}
    </div>
  )
}
