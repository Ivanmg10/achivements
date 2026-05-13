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
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
          style={{
            width: `${sc}%`,
            background: 'linear-gradient(to right, rgb(37 99 235), rgb(96 165 250))',
            boxShadow: '0 0 6px rgb(59 130 246 / 0.5)',
          }}
        />
      )}
      {hc > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
          style={{
            width: `${hc}%`,
            background: 'linear-gradient(to right, rgb(217 119 6), rgb(251 191 36))',
            boxShadow: '0 0 6px rgb(245 158 11 / 0.5)',
          }}
        />
      )}
    </div>
  )
}