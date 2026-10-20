import Link from 'next/link'
import Image from 'next/image'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function GameListRow({
  href,
  imageUrl,
  title,
  subtitle,
  stat,
  statLabel,
  statClassName = 'text-text-main',
  progress,
  share,
}: {
  href: string
  imageUrl?: string
  title: string
  subtitle?: string
  stat: string
  statLabel?: string
  statClassName?: string
  /** The game's completion, 0–100, as a progress bar under its name. */
  progress?: number
  /** Its share against the busiest row, 0–100, as a plain bar (decorative: `stat` says the number). */
  share?: number
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-ink/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      {/* Decorative: the title is right beside it. With the title as its alt, an icon that
          failed to load printed the name inside its 28px box, wrapping over the row. */}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          width={28}
          height={28}
          className="w-7 h-7 rounded shrink-0 object-cover bg-ink/10"
        />
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-text-secondary truncate">{subtitle}</span>
        )}
        {progress !== undefined && <ProgressBar pct={progress} label={title} height="h-1" className="mt-1" />}
        {share !== undefined && (
          <span aria-hidden="true" className="mt-1 h-1 rounded-full bg-ink/10 overflow-hidden">
            <span className="block h-full rounded-full bg-accent/70" style={{ width: `${Math.min(Math.max(share, 0), 100)}%` }} />
          </span>
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
