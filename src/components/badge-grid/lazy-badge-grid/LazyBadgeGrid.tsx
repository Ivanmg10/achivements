import type { ReactNode } from 'react'
import ErrorRetry from '@/components/ui/ErrorRetry'
import BadgeGridSkeleton from '@/components/badge-grid/badge-grid-skeleton/BadgeGridSkeleton'

/**
 * A platform's badge grid while it is read when a card opens: the tiles on their way, then the failure
 * with its retry (and why, where the platform can say), then "nothing here", then the grid itself
 * (`children`). The sections around it hold their room the whole time.
 */
export default function LazyBadgeGrid({
  loading,
  count,
  size,
  error,
  empty,
  centered = false,
  children,
}: {
  loading: boolean
  /** How many tiles to show while loading: the game's known total, or a guess. */
  count: number
  size?: 40 | 48
  /** The read failed: what to say, why, and how to ask again. */
  error: { message: string; hint?: string; retryLabel: string; onRetry: () => void } | null
  /** The read answered with nothing: what to say. Null when there is something to show. */
  empty: string | null
  /** The empty line sits in the middle with a little air (inside a card), not at the panel's edge. */
  centered?: boolean
  children: ReactNode
}) {
  if (loading) return <BadgeGridSkeleton count={count} size={size} />
  if (error) return <ErrorRetry message={error.message} hint={error.hint} retryLabel={error.retryLabel} onRetry={error.onRetry} />
  if (empty !== null) return <p className={`text-sm text-text-secondary ${centered ? 'text-center py-2' : ''}`}>{empty}</p>
  return <>{children}</>
}
