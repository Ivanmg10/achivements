import type { ReactNode } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * A game's progress in the hero: the bar (RA's softcore darker behind the
 * hardcore share), the share on the left and the count on the right.
 */
export default function GameHeroProgress({
  pct,
  softPct,
  label,
  left,
  right,
}: {
  pct: number
  softPct?: number
  /** The bar's accessible name. */
  label: string
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[38.75rem]">
      <ProgressBar pct={pct} softPct={softPct} label={label} height="h-2" />
      <div className="flex justify-between gap-3 text-[0.8125rem] text-text-secondary tabular-nums">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}
