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
  const interactiveCls = 'text-left hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

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
      <span className="text-[10px] uppercase tracking-widest text-text-secondary">{label}</span>
      <span className={`text-2xl font-bold ${accent ?? 'text-text-main'}`}>{value}</span>
      {sub && <span className="text-xs text-text-secondary">{sub}</span>}
    </>
  )
  const cls = `bg-bg-main rounded-xl px-5 py-3 flex flex-col gap-0.5 flex-1 min-w-30 ${className}`
  if (href) return <Link href={href} className={`${cls} ${interactiveCls}`}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} ${interactiveCls}`}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

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
    <div className={`bg-bg-main rounded-lg p-3 flex flex-col gap-1 ${className}`}>
      <span className={`text-xl font-bold ${accent ?? 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
