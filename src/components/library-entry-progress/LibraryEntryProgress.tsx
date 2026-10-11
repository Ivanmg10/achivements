import type { GameSource } from '@/types/steam'

const BAR: Record<GameSource, { open: string; done: string }> = {
  ra: { open: 'bg-accent', done: 'bg-warning' },
  steam: { open: 'bg-[#66c0f4]', done: 'bg-[#a4d007]' },
  psn: { open: 'bg-[#0070d1]', done: 'bg-sky-300' },
}

/** A thin progress bar with its percentage, in the platform's colour; nothing for a game with no progress to tell. */
export default function LibraryEntryProgress({ source, pct, label }: { source: GameSource; pct: number | null; label: string }) {
  if (pct === null) return null
  const shown = Math.min(100, Math.max(0, pct))
  return (
    <span className="flex items-center gap-2">
      <span
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shown)}
        className="h-1.5 flex-1 rounded-full bg-ink/10 overflow-hidden"
      >
        <span className={`block h-full rounded-full ${shown >= 100 ? BAR[source].done : BAR[source].open}`} style={{ width: `${shown}%` }} />
      </span>
      <span className="text-xs tabular-nums text-text-secondary">{Math.round(shown)}%</span>
    </span>
  )
}
