import { useEffect, useState } from 'react'
import { useLocationHash } from '@/hooks/useLocationHash'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { anchorOf, sortEntries, type SortDir, type TableEntry, type TableSort } from '@/utils/achievementTable'

/** `notice`: only the ones the line above the table names (RA's missables, Steam's online ones). */
export type TableFilter = 'all' | 'earned' | 'unearned' | 'notice'

/** Rows shown before "show the other N". */
const FIRST_ROWS = 8
const HIGHLIGHT_MS = 2500

type Options<T> = {
  /** The platform's list as it came: a new one is a new game. */
  items: T[]
  entries: TableEntry<T>[]
  /** The text a search looks in: what the row shows, so a secret one by its hidden label. */
  searchText: (e: TableEntry<T>) => string
  /** Pinned when the page loaded: these lead the list. */
  leads: (e: TableEntry<T>) => boolean
  inNotice?: (e: TableEntry<T>) => boolean
  /** PSN's trophy group; the table then shows one group or all. */
  scopeOf?: (e: TableEntry<T>) => string
  sortValue: (key: string) => ((e: TableEntry<T>) => number) | undefined
  firstDir: (key: string) => SortDir
}

/**
 * The state of a game page's achievement table: filter, group, search, order,
 * the fold, and the deep link. Opening the page on an anchor (`#trophy-12`)
 * clears what would hide that row, scrolls to the copy on screen (row or card)
 * and lights it up for a moment.
 */
export function useAchievementTable<T>({ items, entries, searchText, leads, inNotice, scopeOf, sortValue, firstDir }: Options<T>) {
  const [filter, setFilter] = useState<TableFilter>('all')
  const [scope, setScope] = useState('all')
  const [sort, setSort] = useState<TableSort>({ key: 'default', dir: 'asc' })
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const anchor = anchorOf(useLocationHash())
  const linked = (anchor && entries.find((e) => e.row.anchor === anchor)?.row.id) || null

  useWhenChanged([linked, items], () => {
    if (!linked) return
    setFilter('all')
    setScope('all')
    setQuery('')
    setShowAll(true)
    setHighlighted(linked)
  })

  useEffect(() => {
    if (!linked) return
    const target = [...document.querySelectorAll<HTMLElement>('[data-anchor]')].find(
      (el) => el.dataset.anchor === anchor && el.offsetParent !== null,
    )
    target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [linked, anchor, items])

  const inScope = scopeOf && scope !== 'all' ? entries.filter((e) => scopeOf(e) === scope) : entries
  const earned = inScope.filter((e) => e.row.earned).length
  const noticed = inNotice ? inScope.filter(inNotice) : []
  const q = query.trim().toLowerCase()
  const byFilter = { all: inScope, earned: inScope.filter((e) => e.row.earned), unearned: inScope.filter((e) => !e.row.earned), notice: noticed }[filter]
  const matching = q ? byFilter.filter((e) => searchText(e).toLowerCase().includes(q)) : byFilter
  const sorted = sortEntries(matching, sort, sortValue(sort.key))
  const filtered = [...sorted.filter(leads), ...sorted.filter((e) => !leads(e))]
  const folded = !showAll && !q && filtered.length > FIRST_ROWS

  return {
    filter,
    setFilter,
    toggleNotice: () => setFilter((f) => (f === 'notice' ? 'all' : 'notice')),
    scope,
    setScope,
    query,
    setQuery,
    sort,
    /** The menu's choice: that order, in its first direction. */
    sortBy: (key: string) => setSort({ key, dir: firstDir(key) }),
    /** A column head: its first direction, then the other way. */
    sortColumn: (key: string) =>
      setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: firstDir(key) })),
    highlighted,
    counts: { all: inScope.length, earned, unearned: inScope.length - earned },
    noticed,
    filtered,
    shown: folded ? filtered.slice(0, FIRST_ROWS) : filtered,
    folded,
    /** "Show the other N" while folded, "show fewer" once unfolded; neither for a search or a short list. */
    rest: !q && filtered.length > FIRST_ROWS ? filtered.length - FIRST_ROWS : 0,
    toggleFold: () => setShowAll((v) => !v),
    searching: q !== '',
  }
}
