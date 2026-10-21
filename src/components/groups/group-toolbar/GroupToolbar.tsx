import { useMemo } from 'react'
import { IconChevronDown, IconLayoutGrid, IconList } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroupItem } from '@/types/types'
import { DECADES, type DecadeFilter, type GroupFilters as Filters, type PctFilter } from '@/utils/groupItems'
import GroupViewToggle, { type GroupDetailView } from '@/components/groups/group-view-toggle/GroupViewToggle'

const PILL = 'h-9 px-3 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'
const MENU = `${PILL} inline-flex items-center gap-1.5 ring-1 ring-ink/10 text-text-main bg-transparent hover:ring-ink/25`

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
}: {
  items: GameGroupItem[]
  filters: Filters
  view: GroupDetailView
  onView: (v: GroupDetailView) => void
  onPct: (v: PctFilter) => void
  onDecade: (v: DecadeFilter) => void
  onToggleConsole: (name: string) => void
  onClearConsoles: () => void
}) {
  const { T } = useLanguage()
  const consoles = useMemo(
    () => [...new Set(items.map((i) => i.console_name).filter((n): n is string => !!n))].sort((a, b) => a.localeCompare(b)),
    [items],
  )
  const hasYears = items.some((i) => (i.release_year ?? 0) > 0)
  const picked = filters.consoles.size

  const states: { value: PctFilter; label: string }[] = [
    { value: 'all', label: T.groups.filterAll },
    { value: '0', label: T.groups.filter0 },
    { value: 'progress', label: T.groups.filterProgress },
    { value: '100', label: T.groups.filter100 },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-bg-card ring-1 ring-ink/5">
      <div role="group" aria-label={T.groups.filterProgressLabel} className="flex flex-wrap gap-1">
        {states.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={filters.pct === s.value}
            onClick={() => onPct(s.value)}
            className={`${PILL} ${filters.pct === s.value ? 'bg-text-main text-bg-main font-semibold' : 'text-text-secondary hover:text-text-main'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(consoles.length > 1 || hasYears) && <span aria-hidden="true" className="hidden sm:block w-px h-6 bg-ink/10 mx-1" />}

      {consoles.length > 1 && (
        <details className="relative">
          <summary className={`${MENU} list-none [&::-webkit-details-marker]:hidden`}>
            {T.groups.filterConsoleLabel}: {picked === 0 ? T.groups.allConsoles : picked === 1 ? [...filters.consoles][0] : T.groups.consolesPicked.replace('{n}', String(picked))}
            <IconChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          </summary>
          <fieldset className="absolute z-20 mt-2 min-w-56 max-h-72 overflow-auto p-2 rounded-xl bg-bg-header ring-1 ring-ink/10 shadow-xl flex flex-col gap-0.5">
            <legend className="sr-only">{T.groups.filterConsoleLabel}</legend>
            {consoles.map((name, i) => {
              const id = `group-console-${i}`
              return (
                <label key={name} htmlFor={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-ink/5 cursor-pointer">
                  <input id={id} type="checkbox" checked={filters.consoles.has(name)} onChange={() => onToggleConsole(name)} className="accent-[rgb(var(--accent))]" />
                  {name}
                </label>
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
          <select
            id="group-decade"
            value={filters.decade}
            onChange={(e) => onDecade(e.target.value as DecadeFilter)}
            className={`${MENU} bg-bg-card`}
          >
            <option value="all">{T.groups.decadeAll}</option>
            {DECADES.map((d) => (
              <option key={d} value={d}>{`${d.slice(0, 2)}'s`}</option>
            ))}
          </select>
        </>
      )}

      <div className="ml-auto">
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
