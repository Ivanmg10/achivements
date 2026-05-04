export default function EmptyState({
  icon,
  title,
  subtitle,
  className,
}: {
  icon: string
  title: string
  subtitle: string
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center flex-1 gap-2 text-center px-6 ${className ?? ''}`}>
      <span className="text-5xl">{icon}</span>
      <p className="text-base font-semibold text-text-main">{title}</p>
      <p className="text-sm text-text-secondary/60 max-w-xs">{subtitle}</p>
    </div>
  )
}
