import { useCallback } from 'react'
import { useStoredChoice } from '@/hooks/useStoredChoice'
import { defaultSortStateFor, type SortDir, type StatusSortKey, type StatusSortState } from '@/components/status-sort-control/StatusSortControl'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

export type LibraryView = 'platform' | 'all'

const VIEWS: readonly LibraryView[] = ['platform', 'all']
const COLS: readonly `${StatusGridCols}`[] = ['1', '2', '3']
const SORTS = (['name', 'lastPlayed', 'percent', 'points'] as const).flatMap((k) => (['asc', 'desc'] as const).map((d) => `${k}:${d}` as const))

const encode = ({ key, dir }: StatusSortState) => `${key}:${dir}` as (typeof SORTS)[number]
const decode = (s: string): StatusSortState => {
  const [key, dir] = s.split(':')
  return { key: key as StatusSortKey, dir: dir as SortDir }
}

/**
 * How a status page is laid out, remembered in this browser: the order per
 * category (one for each platform's own list, one for the mixed list), the
 * grid columns and whether platforms are shown apart or together.
 */
export function useLibraryPrefs(cat: string) {
  const fallback = encode(defaultSortStateFor(cat))
  const [sort, setSort] = useStoredChoice(`library-sort:${cat}`, SORTS, fallback)
  const [allSort, setAllSort] = useStoredChoice(`library-sort-all:${cat}`, SORTS, fallback)
  const [cols, setCols] = useStoredChoice('library-cols', COLS, '2')
  const [view, setView] = useStoredChoice<LibraryView>('library-view', VIEWS, 'platform')

  const saveSort = useCallback((s: StatusSortState) => setSort(encode(s)), [setSort])
  const saveAllSort = useCallback((s: StatusSortState) => setAllSort(encode(s)), [setAllSort])
  const saveCols = useCallback((c: StatusGridCols) => setCols(`${c}`), [setCols])

  return {
    sortState: decode(sort), setSortState: saveSort,
    allSortState: decode(allSort), setAllSortState: saveAllSort,
    gridCols: Number(cols) as StatusGridCols, setGridCols: saveCols,
    view, setView,
  }
}
