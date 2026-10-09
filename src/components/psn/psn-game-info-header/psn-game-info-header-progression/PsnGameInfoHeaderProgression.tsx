import { SteamProgressBar } from '@/components/ui/SteamProgressBar'

/**
 * The completion bar under a PSN game's title — SteamGameInfoHeaderProgression's
 * counterpart. The percentage is Sony's, which weighs trophies by grade, so it
 * is not always earned / total.
 */
export default function PsnGameInfoHeaderProgression({
  pct,
  earned,
  total,
  label,
}: {
  pct: number
  earned: number
  total: number
  /** Accessible name for the bar, e.g. the game title. */
  label: string
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs">
      <div className="flex justify-between text-xs text-text-secondary">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full ${pct >= 100 ? 'bg-sky-300' : 'bg-[#0070d1]'}`} />
          <span className="tabular-nums">{pct}%</span>
        </span>
        <span className="tabular-nums">
          {earned} / {total}
        </span>
      </div>
      <SteamProgressBar pct={pct} label={label} trackClass="bg-bg-card" />
    </div>
  )
}
