import { ProgressBar } from '@/components/ui/ProgressBar'

/** A thin progress bar with its percentage, in the theme's colours, green at 100%; nothing for a game with no progress to tell. */
export default function LibraryEntryProgress({ pct, label }: { pct: number | null; label: string }) {
  if (pct === null) return null
  const shown = Math.min(100, Math.max(0, pct))
  return (
    <span className="flex items-center gap-2">
      <ProgressBar pct={shown} label={label} className="flex-1" />
      <span className={`text-xs tabular-nums ${shown >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{Math.round(shown)}%</span>
    </span>
  )
}
