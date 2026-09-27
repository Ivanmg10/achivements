import { ReactNode } from 'react'
import { IconChevronDown } from '@tabler/icons-react'

export type PeriodTone = 'purple' | 'yellow' | 'red'

const TONES: Record<PeriodTone, { text: string; chip: string; ring: string }> = {
  purple: { text: 'text-purple-400', chip: 'bg-purple-500/15 text-purple-400', ring: 'focus-visible:ring-purple-500/70' },
  yellow: { text: 'text-yellow-400', chip: 'bg-yellow-500/15 text-yellow-400', ring: 'focus-visible:ring-yellow-500/70' },
  red: { text: 'text-red-400', chip: 'bg-red-500/15 text-red-400', ring: 'focus-visible:ring-red-500/70' },
}

/**
 * One period in the best-performance card: an icon, the period and when it
 * was, and its total on the right. `expanded` adds the chevron for the month,
 * which opens into its days.
 */
export default function MainPageBestPeriodRow({
  label,
  tone,
  icon,
  value,
  unit,
  when,
  onClick,
  expanded,
}: {
  label: string
  tone: PeriodTone
  icon: ReactNode
  value: string
  unit: string
  when: string
  onClick: () => void
  expanded?: boolean
}) {
  const t = TONES[tone]
  return (
    <button
      onClick={onClick}
      {...(expanded === undefined ? {} : { 'aria-expanded': expanded })}
      className={`w-full bg-bg-main rounded-lg px-3 py-2.5 flex items-center gap-3 text-left cursor-pointer hover:bg-bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 ${t.ring}`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.chip}`} aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className={`text-[10px] uppercase tracking-widest ${t.text}`}>{label}</span>
        <span className="text-xs text-text-secondary truncate">{when}</span>
      </span>
      <span className="flex items-baseline gap-1 shrink-0">
        <span className={`text-xl font-bold tabular-nums ${t.text}`}>{value}</span>
        <span className="text-[10px] text-text-secondary">{unit}</span>
      </span>
      {expanded !== undefined && (
        <IconChevronDown
          className={`w-3.5 h-3.5 text-text-secondary shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
}
