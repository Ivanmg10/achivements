'use client'

import type { ReactNode } from 'react'
import { CountUp } from '@/components/ui/CountUp'

/** One count of the account: what it counts, the number under it (an icon above, where one is given). */
export default function UserVaultStat({
  icon,
  label,
  value,
  accent,
  display,
  format,
  sub,
}: {
  icon?: ReactNode
  label: string
  value: number
  /** Text colour class for the icon and number. */
  accent: string
  /** Shown instead of the counting number, for a value that is not a whole count ("1.5"). */
  display?: string
  /** How to write the number as it counts, for one with a unit ("12 days"). */
  format?: (n: number) => string
  /** A line under the label. */
  sub?: string
}) {
  return (
    <div className="bg-bg-main rounded-tile px-3.5 py-3 flex flex-col gap-0.5 min-w-0">
      {icon && (
        <span aria-hidden="true" className={`${accent} opacity-80 mb-1`}>
          {icon}
        </span>
      )}
      <dt className="text-xs text-text-secondary truncate">{label}</dt>
      <dd className={`text-2xl font-extrabold leading-tight tabular-nums ${accent}`}>
        {display ?? <CountUp value={value} format={format} />}
      </dd>
      {sub && <dd className="text-[10px] text-text-secondary/80 truncate">{sub}</dd>}
    </div>
  )
}
