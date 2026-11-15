import type { ComponentProps } from 'react'
import { Skeleton } from './Skeleton'

/** A row of a list while it loads: its icon, two lines and, when the row has one, a figure at the end. */
export function SkeletonRow({
  icon = 'w-10 h-10',
  radius = 'tile',
  figure = false,
  className = '',
}: {
  icon?: string
  radius?: ComponentProps<typeof Skeleton>['radius']
  figure?: boolean
  className?: string
}) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-2 min-w-0 ${className}`}>
      <Skeleton radius={radius} className={`${icon} shrink-0`} />
      <div className="flex flex-col flex-1 min-w-0 gap-1.5">
        <Skeleton className="h-2.5 w-3/4 max-w-40" />
        <Skeleton className="h-2 w-1/2 max-w-24" />
      </div>
      {figure && <Skeleton className="h-3 w-8 shrink-0" />}
    </div>
  )
}

/** A card's list of games or achievements while it loads. */
export function SkeletonGameList({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} icon="w-7 h-7" figure className="bg-bg-main rounded-tile p-2" />
      ))}
    </div>
  )
}
