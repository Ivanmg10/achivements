import type { ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'

/**
 * One trophy group (the base game or a DLC) in a game's badge grid, as a fold:
 * its name and how far along it is, the badges inside, closed until asked. A native <details>, so
 * it opens with the keyboard and says whether it is open with no script.
 */
export default function PsnTrophyGridGroup({
  name,
  earned,
  total,
  children,
}: {
  name: string
  earned: number
  total: number
  children: ReactNode
}) {
  return (
    <details className="group/fold">
      <summary className="flex items-center gap-1.5 w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs text-text-secondary hover:text-text-main py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1]">
        <IconChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-open/fold:rotate-90" aria-hidden="true" />
        <span className="font-medium">{name}</span>
        <span className={`tabular-nums ${earned === total ? 'text-green-400' : ''}`}>
          {earned}/{total}
        </span>
      </summary>
      <div className="pt-1 pb-2">{children}</div>
    </details>
  )
}
