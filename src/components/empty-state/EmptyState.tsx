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
      <span className={isCompact ? 'text-2xl text-text-secondary opacity-40' : 'text-5xl'} aria-hidden="true">
        {icon}
      </span>
      <p className={isCompact ? 'text-xs text-text-secondary' : 'text-base font-semibold text-text-main'}>{title}</p>
      {subtitle && (
        <p className={isCompact ? 'text-[10px] text-text-secondary/60 max-w-[200px]' : 'text-sm text-text-secondary/60 max-w-xs'}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
