import { useMemo } from 'react'
import { IconChevronDown, IconLayoutGrid, IconList } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroupItem } from '@/types/types'
import { DECADES, type DecadeFilter, type GroupFilters as Filters, type PctFilter } from '@/utils/groupItems'
import GroupViewToggle, { type GroupDetailView } from '@/components/groups/group-view-toggle/GroupViewToggle'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { tabClass } from '@/components/ui/Tabs'
import { MENU_SURFACE } from '@/components/ui/menu'

const MENU = 'h-9 px-3 rounded-control text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer bg-bg-main ring-1 ring-inset ring-ink/10 text-text-main hover:ring-ink/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * One bar over a group's games: progress (all / not started / started /
 * finished), the consoles they are on (when more than one), the decade (once a
 * release year is known) and how to see them.
 */
export default function GroupToolbar({
  items,
  filters,
  view,
  onView,
  onPct,
  onDecade,
  onToggleConsole,
  onClearConsoles,
  counts,
}: {
  items: GameGroupItem[]
  filters: Filters
  view: GroupDetailView
  onView: (v: GroupDetailView) => void
  onPct: (v: PctFilter) => void
  onDecade: (v: DecadeFilter) => void
  onToggleConsole: (name: string) => void
  onClearConsoles: () => void
  /** How many games each state has, beside its name. */
  counts?: { done: number; started: number; notStarted: number }
}) {
  const { T } = useLanguage()
  const consoles = useMemo(
    () => [...new Set(items.map((i) => i.console_name).filter((n): n is string => !!n))].sort((a, b) => a.localeCompare(b)),
    [items],
  )
  const hasYears = items.some((i) => (i.release_year ?? 0) > 0)
  const picked = filters.consoles.size

  const states: { value: PctFilter; label: string; count?: number }[] = [
    { value: 'all', label: T.groups.filterAll, count: items.length },
    { value: '0', label: T.groups.filter0, count: counts?.notStarted },
    { value: 'progress', label: T.groups.filterProgress, count: counts?.started },
    { value: '100', label: T.groups.filter100, count: counts?.done },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 sm:px-4 pb-1.5 shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]">
      <div role="group" aria-label={T.groups.filterProgressLabel} className="flex flex-wrap gap-1 -mb-1.5">
        {states.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={filters.pct === s.value}
            onClick={() => onPct(s.value)}
            className={tabClass(filters.pct === s.value)}
          >
            {s.label}
            {s.count !== undefined && <span className="text-xs font-bold tabular-nums opacity-70">{s.count}</span>}
          </button>
        ))}
      </div>

      <span className="flex-1" aria-hidden="true" />

      {consoles.length > 1 && (
        <details className="relative">
          <summary className={`${MENU} list-none [&::-webkit-details-marker]:hidden`}>
            {T.groups.filterConsoleLabel}: {picked === 0 ? T.groups.allConsoles : picked === 1 ? [...filters.consoles][0] : T.groups.consolesPicked.replace('{n}', String(picked))}
            <IconChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          </summary>
          <fieldset className={`absolute z-20 mt-2 min-w-56 max-h-72 overflow-auto flex flex-col gap-0.5 ${MENU_SURFACE}`}>
            <legend className="sr-only">{T.groups.filterConsoleLabel}</legend>
            {consoles.map((name, i) => {
              const id = `group-console-${i}`
              return (
                <Checkbox key={name} id={id} checked={filters.consoles.has(name)} onChange={() => onToggleConsole(name)} className="px-2 py-1.5 rounded-lg text-sm hover:bg-ink/5">
                  {name}
                </Checkbox>
              )
            })}
            {picked > 0 && (
              <button type="button" onClick={onClearConsoles} className="mt-1 px-2 py-1.5 rounded-lg text-left text-xs text-accent hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
                {T.groups.allConsoles}
              </button>
            )}
          </fieldset>
        </details>
      )}

      {hasYears && (
        <>
          <label htmlFor="group-decade" className="sr-only">{T.groups.filterDecadeLabel}</label>
          <Select<DecadeFilter>
            id="group-decade"
            size="sm"
            value={filters.decade}
            onChange={onDecade}
            options={[
              { value: 'all', label: T.groups.decadeAll },
              ...DECADES.map((d) => ({ value: d as DecadeFilter, label: `${d.slice(0, 2)}'s` })),
            ]}
          />
        </>
      )}

      <div>
        <GroupViewToggle
          value={view}
          onChange={onView}
          options={[
            { value: 'covers', label: T.groups.viewCovers, icon: IconLayoutGrid },
            { value: 'list', label: T.groups.viewList, icon: IconList },
          ]}
        />
      </div>
    </div>
  )
}
