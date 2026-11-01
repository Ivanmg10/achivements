export type Segment<V extends string> = {
  value: V
  label: React.ReactNode
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
  tone = 'solid',
  className = '',
}: {
  'aria-label': string
  value: V
  onChange: (value: V) => void
  options: Segment<V>[]
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** `outline` is a tinted, ringed pill, for a panel with several of these one under another. */
  tone?: 'solid' | 'outline'
  /** Layout only. */
  className?: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const height = size === 'lg' ? 'h-11 text-sm px-2' : size === 'xs' ? 'h-7 text-xs px-2.5' : size === 'md' ? 'h-[2.125rem] text-[0.8125rem] px-4 min-w-20 sm:min-w-24' : 'h-8 text-[0.8125rem] px-3'

  return (
    <div
      role="group"
      aria-label={label}
      className={`relative isolate inline-grid grid-flow-col auto-cols-fr p-[3px] rounded-button bg-ink/[0.06] ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] left-[3px] -z-10 transition-transform duration-(--motion-indicator) ease-(--ease-spring) motion-reduce:transition-none"
        style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      >
        <span className={`absolute inset-y-0 inset-x-[3px] rounded-chip skew-x-(--slant-pill) ${tone === 'outline' ? 'bg-accent/15 ring-2 ring-inset ring-accent' : 'bg-accent'}`} />
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
              on ? (tone === 'outline' ? 'text-text-main' : 'text-bg-main') : 'text-text-secondary hover:text-text-main'
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
