import { ProgressBar } from '@/components/ui/ProgressBar'
import type { CardProgress } from '@/types/gameCard'

/**
 * "x / y achievements" and, under it, the bar with its percentage. Green is only in the text and the
 * percentage when done, never on the bar (it stays in the theme's colour).
 */
export default function GameCardProgress({ progress, label }: { progress: CardProgress; label: string }) {
  const { text, done, pct, softPct = 0 } = progress
  const shown = Math.max(pct ?? 0, softPct)
  return (
    <>
      <span className={`text-sm mt-0.5 ${done ? 'text-success' : 'text-text-secondary'}`}>{text}</span>
      {pct !== null && (
        <span className="flex items-center gap-2 mt-1">
          <ProgressBar pct={pct} softPct={softPct} label={label} trackClass="bg-bg-main" className="flex-1" />
          <span className={`text-xs tabular-nums ${shown >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{Math.round(shown)}%</span>
        </span>
      )}
    </>
  )
}
