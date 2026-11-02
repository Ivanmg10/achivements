import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { tabClass, TAB_ROW } from '@/components/ui/Tabs'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'

/**
 * The line over a game's achievement table (RA, Steam, PlayStation, Xbox): the
 * filters as tabs with their counts, then a search and the order.
 */
export default function AchievementTableToolbar<F extends string, S extends string>({
  label,
  tabs,
  filter,
  onFilter,
  query,
  onQuery,
  sortOptions,
  sort,
  onSort,
  extra,
}: {
  /** The tabs' accessible name. */
  label: string
  tabs: { value: F; label: string; count: number }[]
  filter: F
  onFilter: (f: F) => void
  query: string
  onQuery: (q: string) => void
  sortOptions: { value: S; label: string }[]
  sort: S
  onSort: (s: S) => void
  /** One more control before the search (PSN's and Xbox's reveal-the-secrets). */
  extra?: ReactNode
}) {
  const { T } = useLanguage()
  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 w-full">
      <div className={`${TAB_ROW} flex-1`} role="group" aria-label={label}>
        {tabs.map((t) => (
          <button key={t.value} type="button" onClick={() => onFilter(t.value)} aria-pressed={filter === t.value} className={tabClass(filter === t.value)}>
            {t.label}
            <span className="text-xs font-bold tabular-nums text-text-secondary">{t.count}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 lg:pb-1.5">
        {extra}
        <SearchInput
          aria-label={T.gameInfoTable.searchPlaceholder}
          placeholder={T.gameInfoTable.searchPlaceholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="flex-1 lg:w-[16.25rem] lg:flex-none"
        />
        <Select<S> look="button" size="sm" aria-label={T.gameInfoTable.sortLabel} value={sort} onChange={onSort} options={sortOptions} />
      </div>
    </div>
  )
}
