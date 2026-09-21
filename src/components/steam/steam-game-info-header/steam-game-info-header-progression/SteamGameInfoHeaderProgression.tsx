import { SteamProgressBar } from '@/components/ui/SteamProgressBar'

/**
 * The completion bar under a Steam game's title — the Steam counterpart of
 * GameInfoProgressionHeader. One track, since Steam has no hardcore split.
 */
export default function SteamGameInfoHeaderProgression({
  earned,
  total,
  label,
}: {
  earned: number
  total: number
  /** Accessible name for the bar, e.g. the game title. */
  label: string
}) {
  const pct = total > 0 ? (earned / total) * 100 : 0

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs">
      <div className="flex justify-between text-xs text-text-secondary">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full ${pct >= 100 ? 'bg-[#a4d007]' : 'bg-[#66c0f4]'}`} />
          <span className="tabular-nums">{pct.toFixed(pct >= 100 || pct === 0 ? 0 : 1)}%</span>
        </span>
        <span className="tabular-nums">
          {earned} / {total}
        </span>
      </div>
      <SteamProgressBar pct={pct} label={label} trackClass="bg-bg-card" />
    </div>
  )
}
