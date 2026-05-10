import Link from 'next/link'
import Image from 'next/image'

export function GameListRow({
  href,
  imageUrl,
  imageAlt = '',
  title,
  subtitle,
  stat,
  statLabel,
  statClassName = 'text-text-main',
}: {
  href: string
  imageUrl?: string
  imageAlt?: string
  title: string
  subtitle?: string
  stat: string
  statLabel?: string
  statClassName?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={imageAlt}
          width={28}
          height={28}
          className="rounded shrink-0"
        />
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-text-secondary truncate">{subtitle}</span>
        )}
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className={`text-xs font-bold ${statClassName}`}>{stat}</span>
        {statLabel && (
          <span className="text-[9px] text-text-secondary">{statLabel}</span>
        )}
      </div>
    </Link>
  )
}
