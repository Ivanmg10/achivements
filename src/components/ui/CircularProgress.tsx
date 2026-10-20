/**
 * A ring of progress in the theme's colour, earned/total in the middle; a
 * finished one glows, like ProgressBar, and its count turns the "done" colour.
 */
export function CircularProgress({
  earned,
  total,
  size = 112,
  strokeWidth = 9,
  label,
  center,
  ariaLabel,
  animateIn = false,
}: {
  earned: number
  total: number
  size?: number
  strokeWidth?: number
  label?: string
  /** What goes in the middle instead of earned/total (a level, for instance). */
  center?: React.ReactNode
  /** The ring's accessible name, when earned/total is not what it means. */
  ariaLabel?: string
  /** Fill from empty when it first appears (not under reduced motion). */
  animateIn?: boolean
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.min(earned / total, 1) : 0
  const isComplete = total > 0 && earned >= total

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        role="img"
        aria-label={ariaLabel ?? `${earned} / ${total}`}
        className="relative inline-flex items-center justify-center shrink-0"
        data-complete={isComplete || undefined}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
          style={isComplete ? { filter: 'drop-shadow(0 0 6px rgb(var(--progress) / 0.6))' } : undefined}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-ink/10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            strokeLinecap="round"
            style={animateIn ? ({ '--ring-from': circumference } as React.CSSProperties) : undefined}
            className={`fill-none stroke-progress transition-[stroke-dashoffset] duration-700 ease-out ${animateIn ? 'ring-in' : ''}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {center ?? (
            <span
              className={`font-bold leading-tight ${isComplete ? 'text-success' : 'text-text-main'}`}
              style={{ fontSize: size * 0.19 }}
            >
              {earned}/{total}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs text-text-secondary text-center leading-tight">{label}</span>
      )}
    </div>
  )
}
