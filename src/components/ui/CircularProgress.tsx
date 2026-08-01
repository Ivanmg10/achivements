export function CircularProgress({
  earned,
  total,
  size = 112,
  strokeWidth = 9,
  label,
}: {
  earned: number
  total: number
  size?: number
  strokeWidth?: number
  label?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.min(earned / total, 1) : 0
  const isComplete = total > 0 && earned >= total

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        role="img"
        aria-label={`${earned} / ${total}`}
        className="relative inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-white/10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            strokeLinecap="round"
            className={`fill-none transition-[stroke-dashoffset] duration-700 ease-out ${
              isComplete ? 'stroke-success' : 'stroke-accent'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-bold leading-tight ${isComplete ? 'text-success' : 'text-text-main'}`}
            style={{ fontSize: size * 0.19 }}
          >
            {earned}/{total}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-text-secondary text-center leading-tight">{label}</span>
      )}
    </div>
  )
}
