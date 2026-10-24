const clamp = (n: number) => Math.min(Math.max(n, 0), 100)

/**
 * The progress bar used across the app, in the theme's colours rather than
 * a platform's: one bright bar, and for RA an optional darker one behind it
 * (softcore under hardcore — the same hue, a step down). A finished bar
 * stays in the theme's colour, brightening towards its end with a glow; the
 * green that says "done" is in the percentage beside it, not on the bar.
 *
 * Exposed as a progressbar with its value, so the share never rests on the
 * colour or the length alone. Spans, so it fits inside links and buttons.
 */
export function ProgressBar({
  pct,
  softPct = 0,
  label,
  trackClass = 'bg-ink/10',
  height = 'h-1.5',
  className = '',
}: {
  /** The bright bar: the progress, or RA's hardcore share. */
  pct: number
  /** RA's softcore share, drawn darker behind `pct`. */
  softPct?: number
  /** Accessible name, e.g. the game title. */
  label: string
  trackClass?: string
  height?: string
  className?: string
}) {
  const value = clamp(pct)
  const soft = clamp(softPct)
  const shown = Math.max(value, soft)
  const done = shown >= 100

  // The design's slant: the track's ends are cut on a diagonal, and so is the fill's leading edge.
  const BEVEL = 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)'
  const FILL_EDGE = 'polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%)'

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown)}
      data-complete={done || undefined}
      className={`relative block w-full ${height} ${className}`}
      // Only a finished bar glows.
      style={done ? { filter: 'drop-shadow(0 0 6px rgb(var(--progress) / 0.6))' } : undefined}
    >
      <span data-track className={`absolute inset-0 overflow-hidden ${trackClass}`} style={{ clipPath: BEVEL }}>
        {soft > value && (
          <span
            data-fill="soft"
            className="absolute inset-y-0 left-0 bg-progress-soft transition-[width] duration-500"
            style={{ width: `${soft}%`, clipPath: FILL_EDGE }}
          />
        )}
        {value > 0 && (
          <span
            data-fill="main"
            className="absolute inset-y-0 left-0 bg-progress transition-[width] duration-500"
            style={
              value >= 100
                ? { width: '100%', background: 'linear-gradient(90deg, rgb(var(--progress)), color-mix(in oklab, rgb(var(--progress)) 55%, white))' }
                : { width: `${value}%`, clipPath: FILL_EDGE }
            }
          />
        )}
      </span>
    </span>
  )
}
