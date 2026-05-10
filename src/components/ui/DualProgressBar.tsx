export function DualProgressBar({
  softcorePct,
  hardcorePct,
  trackClass = 'bg-white/10',
  height = 'h-1.5',
  className = '',
}: {
  softcorePct: number
  hardcorePct: number
  trackClass?: string
  height?: string
  className?: string
}) {
  const sc = Math.min(Math.max(softcorePct, 0), 100)
  const hc = Math.min(Math.max(hardcorePct, 0), 100)
  return (
    <div className={`relative w-full ${height} ${trackClass} rounded-full overflow-hidden ${className}`}>
      {sc > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-[width] duration-500"
          style={{ width: `${sc}%` }}
        />
      )}
      {hc > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-yellow-400 rounded-full transition-[width] duration-500"
          style={{ width: `${hc}%` }}
        />
      )}
    </div>
  )
}
