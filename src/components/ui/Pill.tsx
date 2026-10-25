/**
 * The look of a filter chip, for a chip that cannot be a `Pill` (a link, a
 * label around a native input). Pressed: tinted and ringed with the accent.
 */
export function pillClass(on: boolean, className = '') {
  return (
    'inline-flex items-center gap-1.5 h-8 px-3 rounded-chip text-xs font-semibold whitespace-nowrap transition-[color,background-color,box-shadow,scale] duration-(--motion-hover) ' +
    'active:scale-95 motion-reduce:active:scale-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ' +
    (on ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/50 ' : 'bg-ink/[0.06] text-text-secondary hover:text-text-main hover:bg-ink/10 ') +
    className
  )
}

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  pressed: boolean
  /** A number after the label (how many games it leaves). */
  count?: number
  /** Layout only. */
  className?: string
}

/** A filter chip that toggles on and off (`aria-pressed`). */
export default function Pill({ pressed, count, className = '', type = 'button', children, ...rest }: Props) {
  return (
    <button type={type} aria-pressed={pressed} className={pillClass(pressed, className)} {...rest}>
      {children}
      {count !== undefined && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  )
}
