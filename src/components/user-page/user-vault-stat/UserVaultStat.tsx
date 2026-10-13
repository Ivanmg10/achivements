'use client'

import type { ReactNode } from 'react'
import { CountUp } from '@/components/ui/CountUp'

/** One count in "Your vault": an icon in its colour, the number, and what it counts. */
export default function UserVaultStat({
  icon,
  label,
  value,
  accent,
  display,
  sub,
}: {
  icon: ReactNode
  label: string
  value: number
  /** Text colour class for the icon and number. */
  accent: string
  /** Shown instead of the counting number, for a value that is not a whole count ("1.5"). */
  display?: string
  /** A line under the label. */
  sub?: string
}) {
  return (
    <div className="bg-bg-main rounded-2xl px-3 py-3 flex flex-col gap-1.5 min-w-0 ring-1 ring-ink/[0.04]">
      <span aria-hidden="true" className={`${accent} opacity-80`}>
        {icon}
      </span>
      <dd className={`text-2xl font-bold leading-none ${accent}`}>
        {display ?? <CountUp value={value} />}
      </dd>
      <dt className="text-[11px] text-text-secondary truncate">{label}</dt>
      {sub && <dd className="text-[10px] text-text-secondary/80 truncate">{sub}</dd>}
    </div>
  )
}
