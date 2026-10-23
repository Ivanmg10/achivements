export type Segment<V extends string> = {
  value: V
  label: string
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  /** Hide the label under `sm` (the icon stays; the label is kept for screen readers). */
  compact?: boolean
  /** Only the icon, at every width (the label still names it). */
  iconOnly?: boolean
}

/**
 * A choice among a few ways to see the same thing (covers / list, weekly /
 * monthly). Equal cells; the slanted accent pill slides to the chosen one.
 */
export default function SegmentedControl<V extends string>({
  'aria-label': label,
  value,
  onChange,
  options,
  size = 'sm',
  className = '',
}: {
  'aria-label': string
  value: V
  onChange: (value: V) => void
  options: Segment<V>[]
  size?: 'xs' | 'sm'
  /** Layout only. */
  className?: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const height = size === 'xs' ? 'h-7 text-xs px-2.5' : 'h-8 text-[0.8125rem] px-3'

  return (
    <div
      role="group"
      aria-label={label}
      className={`relative isolate inline-grid grid-flow-col auto-cols-fr p-[3px] rounded-control bg-ink/[0.06] ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] left-[3px] -z-10 transition-transform duration-(--motion-indicator) ease-(--ease-spring) motion-reduce:transition-none"
        style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      >
        <span className="absolute inset-y-0 inset-x-[3px] rounded-chip bg-accent skew-x-(--slant-pill)" />
      </span>
      {options.map(({ value: v, label: text, icon: Icon, compact, iconOnly }) => {
        const on = v === value
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            className={`flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold rounded-chip transition-colors duration-(--motion-hover) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${height} ${
              on ? 'text-bg-main' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
            <span className={iconOnly ? 'sr-only' : compact ? 'sr-only sm:not-sr-only' : ''}>{text}</span>
          </button>
        )
      })}
    </div>
  )
}
