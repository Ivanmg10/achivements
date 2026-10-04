import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import type { GameGroupItem } from '@/types/types'
import { DECADES, type DecadeFilter, type GroupFilters as Filters, type PctFilter } from '@/utils/groupItems'
import ConsoleFilter, { type ConsolePill } from '@/components/console-filter/ConsoleFilter'

const CHIP = 'px-3 py-1 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/** One labelled row of single-choice chips; the current one is pressed. */
function ChipRow<V extends string>({ label, options, value, onChange }: { label: string; options: { value: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] uppercase tracking-wider text-text-secondary mr-1">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`${CHIP} ${value === o.value ? 'bg-accent text-bg-main' : 'bg-bg-card text-text-secondary hover:text-text-main'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * The group page's filters: the consoles its games are on (only when there is
 * more than one), progress, and decade (once any release year is known).
 */
export default function GroupFilters({
  items,
  filters,
  onPct,
  onDecade,
  onToggleConsole,
  onClearConsoles,
}: {
  items: GameGroupItem[]
  filters: Filters
  onPct: (v: PctFilter) => void
  onDecade: (v: DecadeFilter) => void
  onToggleConsole: (name: string) => void
  onClearConsoles: () => void
}) {
  const { T } = useLanguage()

  // ConsoleFilter keys its pills by number; here a console is known by name.
  const names = useMemo(
    () => [...new Set(items.map((i) => i.console_name).filter((n): n is string => !!n))].sort((a, b) => a.localeCompare(b)),
    [items],
  )
  const pills: ConsolePill[] = names.map((name, i) => {
    const known = CONSOLES.find((c) => c.name === name)
    return { id: i, name, icon: known?.icon, color: known?.color }
  })
  const selected = new Set(names.flatMap((n, i) => (filters.consoles.has(n) ? [i] : [])))
  const hasYears = items.some((i) => (i.release_year ?? 0) > 0)

  return (
    <div className="flex flex-col gap-2">
      {pills.length > 1 && (
        <div className="flex py-1">
          <ConsoleFilter pills={pills} selected={selected} onToggle={(i) => onToggleConsole(names[i])} onClear={onClearConsoles} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ChipRow<PctFilter>
          label={T.groups.filterProgressLabel}
          value={filters.pct}
          onChange={onPct}
          options={[
            { value: 'all', label: T.groups.filterAll },
            { value: '0', label: T.groups.filter0 },
            { value: 'progress', label: T.groups.filterProgress },
            { value: '100', label: T.groups.filter100 },
          ]}
        />
        {hasYears && (
          <ChipRow<DecadeFilter>
            label={T.groups.filterDecadeLabel}
            value={filters.decade}
            onChange={onDecade}
            options={[{ value: 'all', label: T.groups.filterAll }, ...DECADES.map((d) => ({ value: d, label: `${d.slice(0, 2)}'s` }))]}
          />
        )}
      </div>
    </div>
  )
}
