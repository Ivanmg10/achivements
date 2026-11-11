import { Skeleton } from '@/components/ui/Skeleton'

const MAX_BADGES = 60

/** A grid of badges on its way: as many tiles as the game has achievements (at most a few rows), so the grid lands on its room. */
export default function BadgeGridSkeleton({ count, size = 40 }: { count: number; size?: 40 | 48 }) {
  return (
    <ul aria-busy="true" className="flex flex-wrap gap-1">
      {Array.from({ length: Math.min(count, MAX_BADGES) }).map((_, i) => (
        <li key={i}>
          <Skeleton radius="tile" className={size === 40 ? 'w-10 h-10' : 'w-12 h-12'} />
        </li>
      ))}
    </ul>
  )
}
