import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * A group's overall progress: the shared bar with the share as
 * text beside it, so the number is read, not guessed from the length.
 */
export default function GroupProgressBar({ earned, total, label, className = '' }: { earned: number; total: number; label: string; className?: string }) {
  if (total <= 0) return null
  const pct = Math.min(100, Math.round((earned / total) * 100))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ProgressBar pct={pct} label={label} className="flex-1" />
      <span className={`text-xs tabular-nums shrink-0 ${pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{pct}%</span>
    </div>
  )
}
