export default function EmptyState({
  icon,
  title,
  subtitle,
  className,
  size = 'default',
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  className?: string
  size?: 'default' | 'compact'
}) {
  const isCompact = size === 'compact'

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center px-6 ${isCompact ? '' : 'flex-1'} ${className ?? ''}`}
    >
      <span
        aria-hidden="true"
        className={
          isCompact
            ? 'text-2xl text-text-secondary'
            : 'mb-1 w-14 h-14 rounded-2xl bg-ink/5 ring-1 ring-ink/5 text-text-secondary flex items-center justify-center'
        }
      >
        {icon}
      </span>
      <p className={isCompact ? 'text-xs text-text-secondary' : 'text-base font-semibold text-text-main'}>{title}</p>
      {subtitle && (
        <p className={isCompact ? 'text-[10px] text-text-secondary max-w-[200px]' : 'text-sm text-text-secondary max-w-xs'}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
