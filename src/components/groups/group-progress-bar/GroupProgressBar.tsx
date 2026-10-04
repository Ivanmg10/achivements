/**
 * A group's overall progress: a bar in the theme's accent with the share as
 * text beside it, so the number is read, not guessed from the length.
 */
export default function GroupProgressBar({ earned, total, label, className = '' }: { earned: number; total: number; label: string; className?: string }) {
  if (total <= 0) return null
  const pct = Math.min(100, Math.round((earned / total) * 100))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative h-1.5 flex-1 rounded-full bg-ink/10 overflow-hidden"
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-text-secondary shrink-0">{pct}%</span>
    </div>
  )
}
