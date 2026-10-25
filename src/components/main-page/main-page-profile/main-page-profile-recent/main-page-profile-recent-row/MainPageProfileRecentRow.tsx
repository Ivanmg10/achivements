import type { ReactNode } from 'react'
import Link from 'next/link'

/** One achievement in `MainPageProfileRecent`: its badge (ringed when earned in hardcore), title, a line under it, and the figure on the right. */
export default function MainPageProfileRecentRow({
  href,
  badge,
  hardcore = false,
  title,
  sub,
  right,
}: {
  href: string
  badge: string | null
  hardcore?: boolean
  title: string
  sub: ReactNode
  right?: ReactNode
}) {
  return (
    <li>
    <Link href={href} className="group flex gap-3 items-center py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
      {badge ? (
        <img
          src={badge}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-lg shrink-0 object-cover"
          style={hardcore ? { boxShadow: '0 0 0 2px rgb(var(--bg-card)), 0 0 0 4px rgb(var(--hardcore))' } : undefined}
        />
      ) : (
        <span className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
      )}
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-bold truncate group-hover:text-accent transition-colors">{title}</span>
        <span className="text-[0.8125rem] text-text-secondary truncate">{sub}</span>
      </span>
      {right !== undefined && right !== null && <span className="shrink-0 font-extrabold tabular-nums">{right}</span>}
    </Link>
    </li>
  )
}
