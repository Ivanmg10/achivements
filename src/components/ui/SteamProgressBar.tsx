/**
 * Single-track progress bar in Steam blue. Steam has no hardcore/softcore
 * split, so this replaces DualProgressBar for Steam games rather than
 * reusing it with one track empty.
 *
 * Exposed as a progressbar with its value, so the percentage does not rely
 * on the bar's colour or width alone.
 */
export function SteamProgressBar({
  pct,
  label,
  trackClass = 'bg-white/10',
  height = 'h-1.5',
  className = '',
}: {
  pct: number
  /** Accessible name, e.g. the game title. */
  label: string
  trackClass?: string
  height?: string
  className?: string
}) {
  const value = Math.min(Math.max(pct, 0), 100)
  const complete = value >= 100

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={`relative w-full ${height} ${trackClass} rounded-full overflow-hidden ${className}`}
    >
      {value > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
          style={{
            width: `${value}%`,
            // Steam's own palette: blue while in progress, green once complete.
            background: complete
              ? 'linear-gradient(to right, #6b8f06, #a4d007)'
              : 'linear-gradient(to right, #1a9fff, #66c0f4)',
            boxShadow: complete ? '0 0 6px rgb(164 208 7 / 0.5)' : '0 0 6px rgb(102 192 244 / 0.5)',
          }}
        />
      )}
    </div>
  )
}
