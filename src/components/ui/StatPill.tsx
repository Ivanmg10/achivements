import Link from 'next/link'

export function StatPill({
  label,
  value,
  sub,
  accent,
  size = 'lg',
  className = '',
  href,
  onClick,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  size?: 'sm' | 'lg'
  className?: string
  href?: string
  onClick?: () => void
}) {
  const interactiveCls = 'text-left hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

  if (size === 'sm') {
    const inner = (
      <>
        <span className="text-xs text-text-secondary">{label}</span>
        <span className={`text-sm font-bold ${accent ?? 'text-text-main'}`}>{value}</span>
        {sub && <span className="text-xs text-text-secondary">{sub}</span>}
      </>
    )
    const cls = `bg-bg-main rounded-xl p-2 flex flex-col items-center gap-0.5 ${className}`
    if (href) return <Link href={href} className={`${cls} ${interactiveCls}`}>{inner}</Link>
    if (onClick) return <button type="button" onClick={onClick} className={`${cls} ${interactiveCls}`}>{inner}</button>
    return <div className={cls}>{inner}</div>
  }

  const inner = (
    <>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">{label}</span>
      <span className={`text-[1.75rem] leading-tight font-bold tabular-nums ${accent ?? 'text-text-main'}`}>{value}</span>
      {sub && <span className="text-xs text-text-secondary">{sub}</span>}
    </>
  )
  // No box (the agreed design): figures side by side, a fine slanted rule between them.
  const cls = `relative px-5 py-1 flex flex-col gap-0.5 flex-1 min-w-30 rounded-chip before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-ink/12 before:skew-x-(--slant-button) first:before:hidden ${className}`
  if (href) return <Link href={href} className={`${cls} ${interactiveCls}`}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} ${interactiveCls}`}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

/** A figure on the home's profile card: its label on top, the figure big under it (the agreed design). */
export function StatCard({
  label,
  value,
  accent,
  className = '',
}: {
  label: string
  value: string | number
  accent?: string
  className?: string
}) {
  return (
    <div className={`bg-bg-main rounded-[0.625rem] px-3 py-2.5 flex flex-col gap-0.5 min-w-0 ${className}`}>
      <span className="text-[0.8125rem] text-text-secondary truncate">{label}</span>
      <span className={`text-2xl leading-tight font-extrabold tabular-nums truncate ${accent ?? 'text-text-main'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  )
}
