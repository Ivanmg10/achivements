import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * The completion bar under an Xbox game's title — PsnGameInfoHeaderProgression's
 * counterpart. The percentage is Xbox's, by gamerscore, so it is not always
 * earned / total; `total` is null when Xbox does not say how many achievements
 * there are (newer games), and then only the count earned is shown.
 */
export default function XboxGameInfoHeaderProgression({
  pct,
  earned,
  total,
  label,
}: {
  pct: number
  earned: number
  total: number | null
  /** Accessible name for the bar, e.g. the game title. */
  label: string
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs">
      <div className="flex justify-between text-xs text-text-secondary">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-progress" />
          <span className={`tabular-nums ${pct >= 100 ? 'text-success font-semibold' : ''}`}>{pct}%</span>
        </span>
        <span className="tabular-nums">{total === null ? earned : `${earned} / ${total}`}</span>
      </div>
      <ProgressBar pct={pct} label={label} trackClass="bg-bg-card" />
    </div>
  )
}
